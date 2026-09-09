import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { RepresentationStatus, UserRole } from '@cac/shared';
import { catalogApi, type RepresentationRequest } from '../api/catalogApi';
import { useAuth } from './AuthContext';

export type RepresentationGate = 'none' | 'pending' | 'approved';

type RepresentationContextValue = {
  loading: boolean;
  gate: RepresentationGate;
  canPublish: boolean;
  /** ADMIN ou CURADOR — acesso às rotas /admin/* */
  isStaff: boolean;
  isAdmin: boolean;
  isCurator: boolean;
  requests: RepresentationRequest[];
  approvedOrgIds: string[];
  refresh: () => Promise<void>;
};

const RepresentationContext = createContext<RepresentationContextValue | null>(null);

function deriveGate(requests: RepresentationRequest[]): RepresentationGate {
  if (requests.some((r) => r.status === RepresentationStatus.APPROVED)) return 'approved';
  if (
    requests.some(
      (r) =>
        r.status === RepresentationStatus.REQUESTED ||
        r.status === RepresentationStatus.UNDER_REVIEW,
    )
  ) {
    return 'pending';
  }
  return 'none';
}

export function RepresentationProvider({ children }: PropsWithChildren) {
  const { user, accessToken } = useAuth();
  const [requests, setRequests] = useState<RepresentationRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isCurator = user?.role === UserRole.CURADOR;
  const isStaff = isAdmin || isCurator;

  const refresh = useCallback(async () => {
    if (!accessToken || !user) {
      setRequests([]);
      return;
    }
    // Staff não publica via vínculo institucional — não precisa da fila de representation própria.
    if (isStaff) {
      setRequests([]);
      return;
    }
    setLoading(true);
    try {
      const res = await catalogApi.myRepresentations(accessToken);
      setRequests(res.items);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, user, isStaff]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * ADMIN: bypass de publicação (plataforma) — como antes de 7342ef2.
   * CURADOR: não publica; só governa filas.
   * ORG_*: precisa de representação aprovada.
   */
  const gate = useMemo((): RepresentationGate => {
    if (isAdmin) return 'approved';
    if (isCurator) return 'none';
    return deriveGate(requests);
  }, [isAdmin, isCurator, requests]);

  const canPublish = isAdmin || (!isStaff && gate === 'approved');

  const approvedOrgIds = useMemo(
    () =>
      requests
        .filter((r) => r.status === RepresentationStatus.APPROVED)
        .map((r) => r.organizationId),
    [requests],
  );

  const value = useMemo(
    () => ({
      loading,
      gate,
      canPublish,
      isStaff: Boolean(isStaff),
      isAdmin: Boolean(isAdmin),
      isCurator: Boolean(isCurator),
      requests,
      approvedOrgIds,
      refresh,
    }),
    [loading, gate, canPublish, isStaff, isAdmin, isCurator, requests, approvedOrgIds, refresh],
  );

  return (
    <RepresentationContext.Provider value={value}>{children}</RepresentationContext.Provider>
  );
}

export function useRepresentation() {
  const ctx = useContext(RepresentationContext);
  if (!ctx) throw new Error('useRepresentation must be used within RepresentationProvider');
  return ctx;
}
