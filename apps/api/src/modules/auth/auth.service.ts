import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthUser } from '@cac/shared';
import type { User } from '@prisma/client';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE,
  REFRESH_TOKEN_TTL_MS,
  env,
} from '../../config/env.js';
import type { AuthPayload } from '../../middleware/auth.js';

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function signAccessToken(user: User): string {
  const payload: AuthPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createRefreshTokenValue(): string {
  return randomBytes(48).toString('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    domain: env.cookieDomain === 'localhost' ? undefined : env.cookieDomain,
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: '/',
  });
}

export function clearRefreshCookie(res: Response) {
  const base = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.nodeEnv === 'production',
    domain: env.cookieDomain === 'localhost' ? undefined : env.cookieDomain,
  };
  // limpa path atual e o legado `/api/auth`
  res.clearCookie(REFRESH_COOKIE, { ...base, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: '/api/auth' });
}

export function refreshExpiryDate(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}
