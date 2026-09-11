import { Router } from 'express';
import { loginBodySchema, registerBodySchema } from '@cac/shared';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { REFRESH_COOKIE } from '../../config/env.js';
import {
  clearRefreshCookie,
  createRefreshTokenValue,
  hashPassword,
  hashToken,
  refreshExpiryDate,
  setRefreshCookie,
  signAccessToken,
  toAuthUser,
  verifyPassword,
} from './auth.service.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerBodySchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body as {
      email: string;
      password: string;
      name: string;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'email_taken' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    const refreshToken = createRefreshTokenValue();
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt: refreshExpiryDate(),
      },
    });

    setRefreshCookie(res, refreshToken);
    res.status(201).json({
      accessToken: signAccessToken(user),
      user: toAuthUser(user),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', validateBody(loginBodySchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }
    if (user.status === 'DISABLED') {
      res.status(403).json({ error: 'account_disabled' });
      return;
    }

    const refreshToken = createRefreshTokenValue();
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt: refreshExpiryDate(),
      },
    });

    setRefreshCookie(res, refreshToken);
    res.json({
      accessToken: signAccessToken(user),
      user: toAuthUser(user),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt.getTime() < Date.now()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      clearRefreshCookie(res);
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    if (stored.user.status === 'DISABLED') {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      clearRefreshCookie(res);
      res.status(403).json({ error: 'account_disabled' });
      return;
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const nextRefresh = createRefreshTokenValue();
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(nextRefresh),
        userId: stored.userId,
        expiresAt: refreshExpiryDate(),
      },
    });

    setRefreshCookie(res, nextRefresh);
    res.json({
      accessToken: signAccessToken(stored.user),
      user: toAuthUser(stored.user),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token) {
      await prisma.refreshToken.deleteMany({
        where: { tokenHash: hashToken(token) },
      });
    }
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    if (user.status === 'DISABLED') {
      res.status(403).json({ error: 'account_disabled' });
      return;
    }
    res.json({ user: toAuthUser(user) });
  } catch (error) {
    next(error);
  }
});
