import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { UserRole } from '@cac/shared';
import { catalogApi, type RepresentationRequest } from '../api/catalogApi';
import { connectionsApi, type PendingItem } from '../api/connectionsApi';
import { useAuth } from './AuthContext';

type StaffTasksValue = {
  loading: boolean;
  pendingContent: PendingItem[];
  pendingReps: RepresentationRequest[];
  kpis: Record<string, number> | null;
  contentCount: number;
  repCount: number;
  refresh: () => Promise<void>;
};

const StaffTasksContext = createContext<StaffTasksValue | null>(null);

export function StaffTasksProvider({ children }: PropsWithChildren) {
  const { user, accessToken } = useAuth();
  const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.CURADOR;
  const [loading, setLoading] = useState(false);
  const [pendingContent, setPendingContent] = useState<PendingItem[]>([]);
  const [pendingReps, setPendingReps] = useState<RepresentationRequest[]>([]);
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken || !isStaff) {
      setPendingContent([]);
      setPendingReps([]);
      setKpis(null);
      return;
    }
    setLoading(true);
    try {
      const [pending, reps, kpiRes] = await Promise.all([
        connectionsApi.adminPending(accessToken),
        catalogApi.adminRepresentations(accessToken),
        connectionsApi.kpis(accessToken),
      ]);
      setPendingContent(pending.items);
      setPendingReps(reps.items);
      setKpis(kpiRes.kpis);
    } catch {
      setPendingContent([]);
      setPendingReps([]);
      setKpis(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isStaff]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      loading,
      pendingContent,
      pendingReps,
      kpis,
      contentCount: pendingContent.length,
      repCount: pendingReps.length,
      refresh,
    }),
    [loading, pendingContent, pendingReps, kpis, refresh],
  );

  return <StaffTasksContext.Provider value={value}>{children}</StaffTasksContext.Provider>;
}

export function useStaffTasks() {
  const ctx = useContext(StaffTasksContext);
  if (!ctx) throw new Error('useStaffTasks must be used within StaffTasksProvider');
  return ctx;
}
