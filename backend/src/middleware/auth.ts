import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt.service';
import { User } from '../models/User';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    req.user = verifyAccessToken(token);
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  User.updateOne({ _id: req.user.sub }, { lastActivityAt: new Date() }).catch(() => undefined);
  next();
}

export function requireRole(...roles: Array<'admin' | 'user'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
