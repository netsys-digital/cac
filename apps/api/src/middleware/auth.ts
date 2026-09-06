import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@cac/shared';
import { env } from '../config/env.js';

export type AuthPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    next();
  };
}
