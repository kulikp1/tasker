import { Router } from 'express';
import { z } from 'zod';
import { ShoppingList } from '../models/ShoppingItem';
import { requireAuth } from '../middleware/auth';
import { writeAuditLog } from '../services/auditLog.service';
import { CHANNELS, EVENTS, triggerSafe } from '../services/pusher.service';

export const shoppingRouter = Router();

shoppingRouter.use(requireAuth);

function notifyShoppingUpdated(req: { header(name: string): string | undefined; user?: { workspaceId: string } }): void {
  triggerSafe(CHANNELS.shopping(req.user!.workspaceId), EVENTS.shoppingUpdated, { at: Date.now() }, req.header('x-socket-id'));
}

// A list auto-archives once every item is bought (and there is at least one item).
function maybeAutoArchive(list: InstanceType<typeof ShoppingList>): void {
  if (list.items.length > 0 && list.items.every((i) => i.isPurchased)) {
    list.isArchived = true;
  }
}

shoppingRouter.get('/', async (req, res, next) => {
  try {
    const archived = req.query.archived === 'true';
    const lists = await ShoppingList.find({ workspaceId: req.user!.workspaceId, isArchived: archived }).sort({ createdAt: -1 });
    res.json({ lists });
  } catch (err) {
    next(err);
  }
});

const listSchema = z.object({
  title: z.string().min(1).max(120),
  color: z.string().max(20).optional(),
});

shoppingRouter.post('/', async (req, res, next) => {
  try {
    const data = listSchema.parse(req.body);
    const workspaceId = req.user!.workspaceId;
    const list = await ShoppingList.create({ workspaceId, title: data.title, color: data.color || 'cream', createdBy: req.user!.sub, items: [] });
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'create_shopping_list', targetType: 'shoppingList', targetId: list._id, meta: { title: list.title } });
    notifyShoppingUpdated(req);
    res.status(201).json({ list });
  } catch (err) {
    next(err);
  }
});

const listUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  color: z.string().max(20).optional(),
});

shoppingRouter.patch('/:id', async (req, res, next) => {
  try {
    const data = listUpdateSchema.parse(req.body);
    const workspaceId = req.user!.workspaceId;
    const list = await ShoppingList.findOneAndUpdate({ _id: req.params.id, workspaceId }, data, { new: true });
    if (!list) {
      res.status(404).json({ error: 'Список не знайдено' });
      return;
    }
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'update_shopping_list', targetType: 'shoppingList', targetId: list._id, meta: data });
    notifyShoppingUpdated(req);
    res.json({ list });
  } catch (err) {
    next(err);
  }
});

shoppingRouter.patch('/:id/archive', async (req, res, next) => {
  try {
    const isArchived = Boolean(req.body.isArchived);
    const workspaceId = req.user!.workspaceId;
    const list = await ShoppingList.findOneAndUpdate({ _id: req.params.id, workspaceId }, { isArchived }, { new: true });
    if (!list) {
      res.status(404).json({ error: 'Список не знайдено' });
      return;
    }
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: isArchived ? 'archive_shopping_list' : 'unarchive_shopping_list', targetType: 'shoppingList', targetId: list._id });
    notifyShoppingUpdated(req);
    res.json({ list });
  } catch (err) {
    next(err);
  }
});

shoppingRouter.delete('/:id', async (req, res, next) => {
  try {
    const workspaceId = req.user!.workspaceId;
    const list = await ShoppingList.findOneAndDelete({ _id: req.params.id, workspaceId });
    if (!list) {
      res.status(404).json({ error: 'Список не знайдено' });
      return;
    }
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'delete_shopping_list', targetType: 'shoppingList', targetId: list._id, meta: { title: list.title } });
    notifyShoppingUpdated(req);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const itemSchema = z.object({
  title: z.string().min(1).max(200),
  quantity: z.string().max(60).optional().nullable(),
});

shoppingRouter.post('/:id/items', async (req, res, next) => {
  try {
    const data = itemSchema.parse(req.body);
    const workspaceId = req.user!.workspaceId;
    const list = await ShoppingList.findOne({ _id: req.params.id, workspaceId });
    if (!list) {
      res.status(404).json({ error: 'Список не знайдено' });
      return;
    }
    list.items.push({ title: data.title, quantity: data.quantity || undefined, isPurchased: false });
    // A new item is never pre-purchased, so a previously auto-archived ("everything bought")
    // list must come back to Active - otherwise the item is saved but invisible there.
    list.isArchived = false;
    await list.save();
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'create_shopping_item', targetType: 'shoppingList', targetId: list._id, meta: { title: data.title } });
    notifyShoppingUpdated(req);
    res.status(201).json({ list });
  } catch (err) {
    next(err);
  }
});

const itemUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  quantity: z.string().max(60).optional().nullable(),
  isPurchased: z.boolean().optional(),
});

shoppingRouter.patch('/:id/items/:itemId', async (req, res, next) => {
  try {
    const data = itemUpdateSchema.parse(req.body);
    const workspaceId = req.user!.workspaceId;
    const list = await ShoppingList.findOne({ _id: req.params.id, workspaceId });
    if (!list) {
      res.status(404).json({ error: 'Список не знайдено' });
      return;
    }
    const item = list.items.id(req.params.itemId);
    if (!item) {
      res.status(404).json({ error: 'Пункт не знайдено' });
      return;
    }
    if (data.title !== undefined) item.title = data.title;
    if (data.quantity !== undefined) item.quantity = data.quantity ?? undefined;
    if (data.isPurchased !== undefined) item.isPurchased = data.isPurchased;
    maybeAutoArchive(list);
    await list.save();
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'update_shopping_item', targetType: 'shoppingList', targetId: list._id });
    notifyShoppingUpdated(req);
    res.json({ list });
  } catch (err) {
    next(err);
  }
});

shoppingRouter.delete('/:id/items/:itemId', async (req, res, next) => {
  try {
    const workspaceId = req.user!.workspaceId;
    const list = await ShoppingList.findOne({ _id: req.params.id, workspaceId });
    if (!list) {
      res.status(404).json({ error: 'Список не знайдено' });
      return;
    }
    const item = list.items.id(req.params.itemId);
    if (!item) {
      res.status(404).json({ error: 'Пункт не знайдено' });
      return;
    }
    item.deleteOne();
    await list.save();
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'delete_shopping_item', targetType: 'shoppingList', targetId: list._id });
    notifyShoppingUpdated(req);
    res.json({ list });
  } catch (err) {
    next(err);
  }
});
