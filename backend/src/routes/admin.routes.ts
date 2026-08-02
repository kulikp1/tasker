import { Router } from 'express';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({ workspaceId: req.user!.workspaceId }).select('username email role avatarUrl isOnline lastActivityAt createdAt');
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/logs', async (req, res, next) => {
  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Number(req.query.limit ?? 50));

    const filter: Record<string, unknown> = { workspaceId: req.user!.workspaceId };
    if (userId) {
      filter.userId = userId;
    } else {
      filter.userId = { $ne: req.user!.sub };
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ logs, total, page, limit });
  } catch (err) {
    next(err);
  }
});
