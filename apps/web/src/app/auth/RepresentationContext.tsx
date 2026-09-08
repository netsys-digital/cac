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
  isStaff: boolean;
  requests: RepresentationRequest[];
  approvedOrgIds: string[];
  refresh: () => Promise<void>;
};

const RepresentationContext = createContext<RepresentationContextValue | null>(null);

function deriveGate(
  requests: RepresentationRequest[],
  isStaff: boolean,
): RepresentationGate {
  if (isStaff) return 'approved';
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

  const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.CURADOR;

  const refresh = useCallback(async () => {
    if (!accessToken || !user) {
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
  }, [accessToken, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const gate = useMemo(() => deriveGate(requests, Boolean(isStaff)), [requests, isStaff]);
  const canPublish = gate === 'approved';
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
      requests,
      approvedOrgIds,
      refresh,
    }),
    [loading, gate, canPublish, isStaff, requests, approvedOrgIds, refresh],
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
