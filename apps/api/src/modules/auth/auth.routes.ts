import { Router, type Request } from 'express';
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
} from '@cac/shared';
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
import {
  hitRateLimit,
  isResetTokenValid,
  requestPasswordReset,
  resetPassword,
} from './password-reset.service.js';

export const authRouter = Router();

const RESET_WINDOW_MS = 15 * 60 * 1000;

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.ip || 'unknown';
}

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

authRouter.post('/forgot-password', validateBody(forgotPasswordBodySchema), async (req, res, next) => {
  try {
    const { email, lang } = req.body as { email: string; lang?: 'pt' | 'en' | 'es' };
    const ipLimited = hitRateLimit(`forgot:ip:${clientIp(req)}`, 10, RESET_WINDOW_MS);
    const emailLimited = hitRateLimit(`forgot:email:${email.toLowerCase()}`, 3, RESET_WINDOW_MS);
    if (ipLimited) {
      res.status(429).json({ error: 'too_many_requests' });
      return;
    }
    if (!emailLimited) await requestPasswordReset(email, lang);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/reset-password/validate', async (req, res, next) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (hitRateLimit(`reset-validate:ip:${clientIp(req)}`, 30, RESET_WINDOW_MS)) {
      res.status(429).json({ error: 'too_many_requests' });
      return;
    }
    if (token.length < 32) {
      res.json({ valid: false });
      return;
    }
    res.json(await isResetTokenValid(token));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/reset-password', validateBody(resetPasswordBodySchema), async (req, res, next) => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    if (hitRateLimit(`reset:ip:${clientIp(req)}`, 20, RESET_WINDOW_MS)) {
      res.status(429).json({ error: 'too_many_requests' });
      return;
    }
    const ok = await resetPassword(token, password);
    if (!ok) {
      res.status(400).json({ error: 'invalid_or_expired_token' });
      return;
    }
    clearRefreshCookie(res);
    res.json({ ok: true });
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
