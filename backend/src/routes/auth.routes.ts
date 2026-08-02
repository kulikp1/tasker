import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { User } from '../models/User';
import { requireAuth } from '../middleware/auth';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/jwt.service';
import { verifyGoogleCredential } from '../services/google.service';
import { writeAuditLog } from '../services/auditLog.service';

export const authRouter = Router();

const cookieBaseOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax' as const,
  domain: env.cookieDomain,
  path: '/',
};

function setAuthCookies(res: import('express').Response, accessToken: string, refreshToken: string): void {
  res.cookie('accessToken', accessToken, { ...cookieBaseOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieBaseOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

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

const googleLoginSchema = z.object({
  credential: z.string().min(1),
});

authRouter.post('/google', async (req, res, next) => {
  try {
    const { credential } = googleLoginSchema.parse(req.body);
    const profile = await verifyGoogleCredential(credential);
    const user = await User.findOne({ $or: [{ googleId: profile.googleId }, { email: profile.email }] });
    if (!user) {
      res.status(403).json({ error: 'Вас не запрошено до застосунку. Зверніться до адміністратора.' });
      return;
    }
    if (!user.googleId) {
      user.googleId = profile.googleId;
      if (profile.name) user.username = profile.name;
      if (profile.avatarUrl && !user.avatarUrl) user.avatarUrl = profile.avatarUrl;
    }
    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, username: user.username, workspaceId: user.workspaceId.toString() });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });
    setAuthCookies(res, accessToken, refreshToken);
    user.isOnline = true;
    user.lastActivityAt = new Date();
    await user.save();
    await writeAuditLog({ workspaceId: user.workspaceId, userId: user._id, username: user.username, action: 'login', targetType: 'user', targetId: user._id });
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, username: user.username, workspaceId: user.workspaceId.toString() });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user: toPublicUser(user) });
  } catch {
    res.status(401).json({ error: 'Сесія недійсна, увійдіть знову' });
  }
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.sub);
  if (user) {
    user.isOnline = false;
    await user.save();
  }
  res.clearCookie('accessToken', cookieBaseOptions);
  res.clearCookie('refreshToken', cookieBaseOptions);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.sub);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: toPublicUser(user) });
});
