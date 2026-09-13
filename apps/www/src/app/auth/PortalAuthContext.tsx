import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { AuthUser } from '@cac/shared';
import { urls } from '../../config';

const ACCESS_TOKEN_KEY = 'cac.www.accessToken';

type PortalAuthValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  getAccessToken: () => Promise<string | null>;
};

const PortalAuthContext = createContext<PortalAuthValue>({
  user: null,
  accessToken: null,
  loading: true,
  getAccessToken: async () => null,
});

function readStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistAccessToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    else sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function refreshViaCookie(): Promise<{ user: AuthUser; accessToken: string } | null> {
  try {
    const res = await fetch(`${urls.api}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: AuthUser; accessToken?: string };
    if (!data.user || !data.accessToken) return null;
    return { user: data.user, accessToken: data.accessToken };
  } catch {
    return null;
  }
}

async function meViaToken(accessToken: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${urls.api}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: AuthUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}

function consumeHashAccessToken(): string | null {
  try {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hash.get('cac_at');
    if (!token) return null;
    hash.delete('cac_at');
    const nextHash = hash.toString();
    const next = `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ''}`;
    window.history.replaceState({}, '', next);
    return token;
  } catch {
    return null;
  }
}

function requestSessionFromPanel(): Promise<{ user: AuthUser; accessToken: string } | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const bridgeOrigin = new URL(urls.web).origin;
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'auth-bridge');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
    iframe.src = `${urls.web}/auth/bridge?origin=${encodeURIComponent(window.location.origin)}`;

    let settled = false;
    const finish = (value: { user: AuthUser; accessToken: string } | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      iframe.remove();
      resolve(value);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== bridgeOrigin) return;
      const data = event.data as {
        source?: string;
        accessToken?: string | null;
        user?: AuthUser | null;
      };
      if (data?.source !== 'cac-auth-bridge') return;
      if (data.accessToken && data.user) {
        finish({ accessToken: data.accessToken, user: data.user });
        return;
      }
      finish(null);
    };

    window.addEventListener('message', onMessage);
    document.body.appendChild(iframe);
    window.setTimeout(() => finish(null), 4500);
  });
}

export function PortalAuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((token: string, nextUser: AuthUser) => {
    setAccessToken(token);
    setUser(nextUser);
    persistAccessToken(token);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    persistAccessToken(null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fromHash = consumeHashAccessToken();
      if (fromHash) {
        const me = await meViaToken(fromHash);
        if (me) {
          applySession(fromHash, me);
          return;
        }
      }

      const fromCookie = await refreshViaCookie();
      if (fromCookie) {
        applySession(fromCookie.accessToken, fromCookie.user);
        return;
      }

      const stored = readStoredAccessToken();
      if (stored) {
        const me = await meViaToken(stored);
        if (me) {
          applySession(stored, me);
          return;
        }
        persistAccessToken(null);
      }

      const fromPanel = await requestSessionFromPanel();
      if (fromPanel) {
        applySession(fromPanel.accessToken, fromPanel.user);
        return;
      }

      clearSession();
    } finally {
      setLoading(false);
    }
  }, [applySession, clearSession]);

  const getAccessToken = useCallback(async () => {
    if (accessToken) {
      const me = await meViaToken(accessToken);
      if (me) {
        setUser(me);
        return accessToken;
      }
    }

    const fromCookie = await refreshViaCookie();
    if (fromCookie) {
      applySession(fromCookie.accessToken, fromCookie.user);
      return fromCookie.accessToken;
    }

    const stored = readStoredAccessToken();
    if (stored) {
      const me = await meViaToken(stored);
      if (me) {
        applySession(stored, me);
        return stored;
      }
    }

    const fromPanel = await requestSessionFromPanel();
    if (fromPanel) {
      applySession(fromPanel.accessToken, fromPanel.user);
      return fromPanel.accessToken;
    }

    clearSession();
    return null;
  }, [accessToken, applySession, clearSession]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(
    () => ({ user, accessToken, loading, getAccessToken }),
    [user, accessToken, loading, getAccessToken],
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}

export function usePortalAuth() {
  return useContext(PortalAuthContext);
}
