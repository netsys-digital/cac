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

type PortalAuthValue = {
  user: AuthUser | null;
  loading: boolean;
};

const PortalAuthContext = createContext<PortalAuthValue>({ user: null, loading: true });

async function refreshSession(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${urls.api}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: AuthUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function PortalAuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const next = await refreshSession();
    setUser(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}

export function usePortalAuth() {
  return useContext(PortalAuthContext);
}
