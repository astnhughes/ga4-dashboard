import { Request, Response, NextFunction } from 'express';
import { verifyToken, getCookie } from '../routes/auth';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getCookie(req, 'session');
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || payload.exp < Date.now()) {
    res.clearCookie('session', { path: '/' });
    res.status(401).json({ error: 'Session expired' });
    return;
  }

  next();
}
