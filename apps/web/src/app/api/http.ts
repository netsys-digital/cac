import type { AuthUser } from '@cac/shared';
import { urls } from '../../config';
import * as authApi from './authApi';

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

/** Callback registrado pelo AuthProvider para persistir token renovado. */
let onSessionRefreshed: ((session: AuthResponse) => void) | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function registerSessionRefresher(handler: ((session: AuthResponse) => void) | null) {
  onSessionRefreshed = handler;
}

/** Renova o access token via cookie de refresh (uma chamada por vez). */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const session = await authApi.refresh();
      onSessionRefreshed?.(session);
      return session.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function api<T>(
  path: string,
  options: RequestInit & { accessToken?: string | null; skipAuthRetry?: boolean } = {},
): Promise<T> {
  const { accessToken, headers, skipAuthRetry, ...rest } = options;
  const res = await fetch(`${urls.api}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (res.status === 401 && !skipAuthRetry) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      return api<T>(path, { ...options, accessToken: nextToken, skipAuthRetry: true });
    }
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
    };
    const fieldMsgs = body.details?.fieldErrors
      ? Object.entries(body.details.fieldErrors)
          .flatMap(([field, msgs]) => (msgs ?? []).map((m) => `${field}: ${m}`))
          .join('; ')
      : '';
    const formMsgs = body.details?.formErrors?.join('; ') ?? '';
    const detail = [fieldMsgs, formMsgs].filter(Boolean).join(' · ');
    throw new Error(
      detail ? `${body.error ?? `http_${res.status}`}: ${detail}` : (body.error ?? `http_${res.status}`),
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
