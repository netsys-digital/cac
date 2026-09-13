import { useCallback, useEffect, useState } from 'react';
import { usePortalAuth } from '../auth/PortalAuthContext';
import { urls } from '../../config';
import { searchTypeToSavedType, savedFavoriteKey } from './useSavedFavoriteKeys';

export type EngagementKind = 'interest' | 'connected';

type ConnectionRow = {
  targetType: string;
  targetId: string;
  status: string;
  requesterUserId?: string;
};

function statusToKind(status: string): EngagementKind | null {
  if (status === 'PENDING') return 'interest';
  if (status === 'ACCEPTED' || status === 'CONTACT_SHARED') return 'connected';
  return null;
}

/**
 * Carrega conexões do usuário logado e indica interesse (PENDING)
 * ou conexão realizada (ACCEPTED / CONTACT_SHARED) por item.
 */
export function useConnectionEngagement() {
  const { user, getAccessToken, loading: authLoading } = usePortalAuth();
  const [map, setMap] = useState<Map<string, EngagementKind>>(() => new Map());

  const reload = useCallback(async () => {
    const token = await getAccessToken();
    if (!token || !user?.id) {
      setMap(new Map());
      return;
    }
    try {
      const res = await fetch(`${urls.api}/api/connections`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setMap(new Map());
        return;
      }
      const body = (await res.json()) as { items?: ConnectionRow[] };
      const next = new Map<string, EngagementKind>();
      for (const item of body.items ?? []) {
        if (item.requesterUserId !== user.id) continue;
        const kind = statusToKind(item.status);
        if (!kind) continue;
        const key = savedFavoriteKey(item.targetType, item.targetId);
        const prev = next.get(key);
        // connected prevalece sobre interest
        if (prev === 'connected') continue;
        next.set(key, kind);
      }
      setMap(next);
    } catch {
      setMap(new Map());
    }
  }, [getAccessToken, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    void reload();
  }, [authLoading, reload]);

  useEffect(() => {
    function onFocus() {
      void reload();
    }
    function onVisibility() {
      if (document.visibilityState === 'visible') void reload();
    }
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reload]);

  const getKind = useCallback(
    (targetType: string, targetId: string): EngagementKind | null =>
      map.get(savedFavoriteKey(targetType, targetId)) ?? null,
    [map],
  );

  const getKindForSearch = useCallback(
    (contentType: string, id: string): EngagementKind | null => {
      const savedType = searchTypeToSavedType(contentType);
      if (!savedType) return null;
      return getKind(savedType, id);
    },
    [getKind],
  );

  return { getKind, getKindForSearch, reload };
}
