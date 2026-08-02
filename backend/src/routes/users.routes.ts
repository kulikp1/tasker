import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { requireAuth } from '../middleware/auth';
import { writeAuditLog } from '../services/auditLog.service';

export const usersRouter = Router();

function toPublicUser(user: InstanceType<typeof User>) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId.toString(),
    avatarUrl: user.avatarUrl,
  };
}

usersRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const users = await User.find({ workspaceId: req.user!.workspaceId }).select('username avatarUrl role');
    res.json({
      users: users.map((u) => ({ id: u._id.toString(), username: u.username, avatarUrl: u.avatarUrl, role: u.role })),
    });
  } catch (err) {
    next(err);
  }
});

usersRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.sub);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

const updateMeSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_.]+$/, 'Лише латиниця, цифри, крапка та підкреслення').optional(),
  avatarUrl: z.string().url().optional(),
});

usersRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const data = updateMeSchema.parse(req.body);
    const user = await User.findById(req.user!.sub);
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (data.username && data.username.toLowerCase() !== user.username) {
      const existing = await User.findOne({ username: data.username.toLowerCase() });
      if (existing) {
        res.status(409).json({ error: 'Такий юзернейм вже зайнятий' });
        return;
      }
      user.username = data.username.toLowerCase();
    }
    if (data.avatarUrl) {
      user.avatarUrl = data.avatarUrl;
    }
    await user.save();
    await writeAuditLog({ workspaceId: user.workspaceId, userId: user._id, username: user.username, action: 'update_profile', targetType: 'user', targetId: user._id, meta: data });
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
});

// Any workspace member can invite - never into someone else's workspace, always their own,
// and never with more privilege than the inviter themselves has.
usersRouter.post('/invite', requireAuth, async (req, res, next) => {
  try {
    const data = inviteSchema.parse(req.body);
    if (data.role === 'admin' && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Лише адмін може запрошувати інших адмінів' });
      return;
    }
    const email = data.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'Користувач з такою поштою вже існує' });
      return;
    }
    const username = email.split('@')[0];
    const user = await User.create({ username, email, role: data.role, workspaceId: req.user!.workspaceId });
    await writeAuditLog({
      workspaceId: req.user!.workspaceId,
      userId: req.user!.sub,
      username: req.user!.username,
      action: 'create_user',
      targetType: 'user',
      targetId: user._id,
      meta: { invitedEmail: user.email, role: user.role },
    });
    res.status(201).json({
      user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});
