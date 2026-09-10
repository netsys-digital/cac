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
import * as authApi from '../api/authApi';
import { registerSessionRefresher } from '../api/http';

const ACCESS_TOKEN_KEY = 'cac.web.accessToken';

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Garante access token válido (renova via refresh cookie se necessário). */
  ensureAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
    // ignore private mode / quota
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
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

  useEffect(() => {
    registerSessionRefresher((session) => {
      applySession(session.accessToken, session.user);
    });
    return () => registerSessionRefresher(null);
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await authApi.refresh();
        if (cancelled) return;
        applySession(session.accessToken, session.user);
        return;
      } catch {
        const stored = readStoredAccessToken();
        if (stored) {
          try {
            const me = await authApi.me(stored);
            if (cancelled) return;
            applySession(stored, me.user);
            return;
          } catch {
            persistAccessToken(null);
          }
        }
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const ensureAccessToken = useCallback(async () => {
    try {
      const session = await authApi.refresh();
      applySession(session.accessToken, session.user);
      return session.accessToken;
    } catch {
      const stored = accessToken || readStoredAccessToken();
      if (!stored) {
        clearSession();
        return null;
      }
      try {
        const me = await authApi.me(stored);
        applySession(stored, me.user);
        return stored;
      } catch {
        clearSession();
        return null;
      }
    }
  }, [accessToken, applySession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await authApi.login({ email, password });
      applySession(session.accessToken, session.user);
    },
    [applySession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const session = await authApi.register({ name, email, password });
      applySession(session.accessToken, session.user);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, accessToken, loading, login, register, logout, ensureAccessToken }),
    [user, accessToken, loading, login, register, logout, ensureAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
