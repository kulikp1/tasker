import { Router } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Column } from '../models/Column';
import { Task } from '../models/Task';
import { requireAuth } from '../middleware/auth';
import { writeAuditLog } from '../services/auditLog.service';
import { createNotification } from '../services/notification.service';
import { CHANNELS, EVENTS, triggerSafe } from '../services/pusher.service';

export const boardRouter = Router();

boardRouter.use(requireAuth);

function notifyBoardUpdated(req: { header(name: string): string | undefined; user?: { workspaceId: string } }): void {
  triggerSafe(CHANNELS.board(req.user!.workspaceId), EVENTS.boardUpdated, { at: Date.now() }, req.header('x-socket-id'));
}

boardRouter.get('/', async (req, res, next) => {
  try {
    const workspaceId = req.user!.workspaceId;
    const [columns, tasks] = await Promise.all([
      Column.find({ workspaceId }).sort({ order: 1 }),
      Task.find({ workspaceId }).sort({ order: 1 }),
    ]);
    res.json({ columns, tasks });
  } catch (err) {
    next(err);
  }
});

const columnSchema = z.object({
  title: z.string().min(1).max(60),
  isTerminal: z.boolean().optional(),
});

boardRouter.post('/columns', async (req, res, next) => {
  try {
    const data = columnSchema.parse(req.body);
    const workspaceId = req.user!.workspaceId;
    const maxOrder = await Column.findOne({ workspaceId }).sort({ order: -1 }).select('order');
    const column = await Column.create({ ...data, workspaceId, order: (maxOrder?.order ?? -1) + 1 });
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'create_column', targetType: 'column', targetId: column._id, meta: { title: column.title } });
    notifyBoardUpdated(req);
    res.status(201).json({ column });
  } catch (err) {
    next(err);
  }
});

const columnUpdateSchema = z.object({
  title: z.string().min(1).max(60).optional(),
  isTerminal: z.boolean().optional(),
});

boardRouter.patch('/columns/:id', async (req, res, next) => {
  try {
    const data = columnUpdateSchema.parse(req.body);
    const column = await Column.findOneAndUpdate({ _id: req.params.id, workspaceId: req.user!.workspaceId }, data, { new: true });
    if (!column) {
      res.status(404).json({ error: 'Колонку не знайдено' });
      return;
    }
    await writeAuditLog({ workspaceId: req.user!.workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'update_column', targetType: 'column', targetId: column._id, meta: data });
    notifyBoardUpdated(req);
    res.json({ column });
  } catch (err) {
    next(err);
  }
});

boardRouter.delete('/columns/:id', async (req, res, next) => {
  try {
    const workspaceId = req.user!.workspaceId;
    const column = await Column.findOneAndDelete({ _id: req.params.id, workspaceId });
    if (!column) {
      res.status(404).json({ error: 'Колонку не знайдено' });
      return;
    }
    await Task.deleteMany({ columnId: column._id, workspaceId });
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'delete_column', targetType: 'column', targetId: column._id, meta: { title: column.title } });
    notifyBoardUpdated(req);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const reorderSchema = z.object({ orderedIds: z.array(z.string()) });

boardRouter.patch('/columns-reorder', async (req, res, next) => {
  try {
    const { orderedIds } = reorderSchema.parse(req.body);
    const workspaceId = req.user!.workspaceId;
    await Promise.all(orderedIds.map((id, index) => Column.updateOne({ _id: id, workspaceId }, { order: index })));
    notifyBoardUpdated(req);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  columnId: z.string(),
  assigneeId: z.string().optional().nullable(),
  deadlineDate: z.string().optional().nullable(),
  deadlineTime: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  tag: z.string().max(40).optional().nullable(),
  tagColor: z.string().max(20).optional().nullable(),
});

boardRouter.post('/tasks', async (req, res, next) => {
  try {
    const data = taskSchema.parse(req.body);
    const workspaceId = req.user!.workspaceId;
    const column = await Column.findOne({ _id: data.columnId, workspaceId });
    if (!column) {
      res.status(404).json({ error: 'Колонку не знайдено' });
      return;
    }
    const maxOrder = await Task.findOne({ columnId: data.columnId, workspaceId }).sort({ order: -1 }).select('order');
    const task = await Task.create({
      ...data,
      workspaceId,
      assigneeId: data.assigneeId || undefined,
      deadlineDate: data.deadlineDate || undefined,
      deadlineTime: data.deadlineTime || undefined,
      imageUrl: data.imageUrl || undefined,
      tag: data.tag || undefined,
      tagColor: data.tagColor || undefined,
      order: (maxOrder?.order ?? -1) + 1,
      createdBy: req.user!.sub,
    });
    if (task.assigneeId && task.assigneeId.toString() !== req.user!.sub) {
      await createNotification({
        recipientId: task.assigneeId,
        type: 'task_assigned',
        payload: {
          taskId: task._id,
          taskTitle: task.title,
          fromUserId: req.user!.sub,
          fromUsername: req.user!.username,
          deadlineDate: task.deadlineDate,
          deadlineTime: task.deadlineTime,
        },
      });
    }
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'create_task', targetType: 'task', targetId: task._id, meta: { title: task.title } });
    notifyBoardUpdated(req);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

const moveSchema = z.object({
  taskId: z.string(),
  toColumnId: z.string(),
  orderedTaskIds: z.array(z.string()),
});

// Registered before /tasks/:id - otherwise Express would match "move" as the :id param
// (PATCH /tasks/move would 500 trying to cast "move" to an ObjectId).
boardRouter.patch('/tasks/move', async (req, res, next) => {
  try {
    const { taskId, toColumnId, orderedTaskIds } = moveSchema.parse(req.body);
    const workspaceId = req.user!.workspaceId;
    const task = await Task.findOne({ _id: taskId, workspaceId });
    if (!task) {
      res.status(404).json({ error: 'Таску не знайдено' });
      return;
    }
    const isCreator = task.createdBy.toString() === req.user!.sub;
    const isAssignee = task.assigneeId?.toString() === req.user!.sub;
    if (!isCreator && !isAssignee) {
      res.status(403).json({ error: 'Немає прав переміщувати цю таску' });
      return;
    }
    const toColumn = await Column.findOne({ _id: toColumnId, workspaceId });
    if (!toColumn) {
      res.status(404).json({ error: 'Колонку не знайдено' });
      return;
    }
    const fromColumnId = task.columnId.toString();
    task.columnId = new Types.ObjectId(toColumnId);
    await task.save();
    await Promise.all(orderedTaskIds.map((id, index) => Task.updateOne({ _id: id, workspaceId }, { order: index, columnId: toColumnId })));

    if (fromColumnId !== toColumnId) {
      if (toColumn.isTerminal && isAssignee && !isCreator) {
        await createNotification({
          recipientId: task.createdBy,
          type: 'task_completed',
          payload: {
            taskId: task._id,
            taskTitle: task.title,
            fromUserId: req.user!.sub,
            fromUsername: req.user!.username,
          },
        });
      }
    }
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'move_task', targetType: 'task', targetId: task._id, meta: { fromColumnId, toColumnId } });
    notifyBoardUpdated(req);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const taskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  deadlineDate: z.string().optional().nullable(),
  deadlineTime: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  tag: z.string().max(40).optional().nullable(),
  tagColor: z.string().max(20).optional().nullable(),
});

boardRouter.patch('/tasks/:id', async (req, res, next) => {
  try {
    const data = taskUpdateSchema.parse(req.body);
    const workspaceId = req.user!.workspaceId;
    const task = await Task.findOne({ _id: req.params.id, workspaceId });
    if (!task) {
      res.status(404).json({ error: 'Таску не знайдено' });
      return;
    }
    if (task.createdBy.toString() !== req.user!.sub) {
      res.status(403).json({ error: 'Редагувати таску може лише її автор' });
      return;
    }
    const previousAssignee = task.assigneeId?.toString();
    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description ?? undefined;
    if (data.assigneeId !== undefined) task.assigneeId = (data.assigneeId as any) || undefined;
    if (data.deadlineDate !== undefined) task.deadlineDate = data.deadlineDate ?? undefined;
    if (data.deadlineTime !== undefined) task.deadlineTime = data.deadlineTime ?? undefined;
    if (data.imageUrl !== undefined) task.imageUrl = data.imageUrl ?? undefined;
    if (data.tag !== undefined) task.tag = data.tag ?? undefined;
    if (data.tagColor !== undefined) task.tagColor = data.tagColor ?? undefined;
    await task.save();

    const newAssignee = task.assigneeId?.toString();
    if (newAssignee && newAssignee !== previousAssignee && newAssignee !== req.user!.sub) {
      await createNotification({
        recipientId: newAssignee,
        type: 'task_assigned',
        payload: {
          taskId: task._id,
          taskTitle: task.title,
          fromUserId: req.user!.sub,
          fromUsername: req.user!.username,
          deadlineDate: task.deadlineDate,
          deadlineTime: task.deadlineTime,
        },
      });
    }
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'update_task', targetType: 'task', targetId: task._id, meta: data });
    notifyBoardUpdated(req);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

boardRouter.delete('/tasks/:id', async (req, res, next) => {
  try {
    const workspaceId = req.user!.workspaceId;
    const task = await Task.findOne({ _id: req.params.id, workspaceId });
    if (!task) {
      res.status(404).json({ error: 'Таску не знайдено' });
      return;
    }
    if (task.createdBy.toString() !== req.user!.sub) {
      res.status(403).json({ error: 'Видаляти таску може лише її автор' });
      return;
    }
    await task.deleteOne();
    await writeAuditLog({ workspaceId, userId: req.user!.sub, username: req.user!.username, action: 'delete_task', targetType: 'task', targetId: task._id, meta: { title: task.title } });
    notifyBoardUpdated(req);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
