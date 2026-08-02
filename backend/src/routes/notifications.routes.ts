import { Router } from 'express';
import { Notification } from '../models/Notification';
import { requireAuth } from '../middleware/auth';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user!.sub }).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Notification.countDocuments({ recipientId: req.user!.sub, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user!.sub },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      res.status(404).json({ error: 'Сповіщення не знайдено' });
      return;
    }
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ recipientId: req.user!.sub, isRead: false }, { isRead: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
