import type { AuthUser } from '@cac/shared';
import { urls } from '../../config';

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${urls.api}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('register_failed');
  return parseJson(res);
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${urls.api}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(typeof body.error === 'string' ? body.error : 'login_failed');
  }
  return parseJson(res);
}

export async function refresh(): Promise<AuthResponse> {
  const res = await fetch(`${urls.api}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('refresh_failed');
  return parseJson(res);
}

export async function me(accessToken: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${urls.api}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('me_failed');
  return parseJson(res);
}

async function errorCode(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return typeof body.error === 'string' ? body.error : fallback;
}

export async function forgotPassword(input: { email: string; lang?: string }): Promise<void> {
  const res = await fetch(`${urls.api}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorCode(res, 'forgot_failed'));
}

export async function validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
  const res = await fetch(
    `${urls.api}/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) throw new Error(await errorCode(res, 'validate_failed'));
  return parseJson(res);
}

export async function resetPassword(input: { token: string; password: string }): Promise<void> {
  const res = await fetch(`${urls.api}/api/auth/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorCode(res, 'reset_failed'));
}

export async function logout(): Promise<void> {
  await fetch(`${urls.api}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
