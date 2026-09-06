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

const ACCESS_TOKEN_KEY = 'cac.web.accessToken';

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
    let cancelled = false;
    (async () => {
      try {
        // 1) Cookie httpOnly de refresh (via proxy same-origin em dev)
        const session = await authApi.refresh();
        if (cancelled) return;
        applySession(session.accessToken, session.user);
        return;
      } catch {
        // 2) Fallback: access token ainda válido no sessionStorage
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
    () => ({ user, accessToken, loading, login, register, logout }),
    [user, accessToken, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
