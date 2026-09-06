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
  if (!res.ok) throw new Error('login_failed');
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

export async function logout(): Promise<void> {
  await fetch(`${urls.api}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
