import { useCallback, useEffect, useState } from 'react';
import { usePortalAuth } from '../auth/PortalAuthContext';
import { urls } from '../../config';

export function savedFavoriteKey(targetType: string, targetId: string) {
  return `${targetType}:${targetId}`;
}

/** Mapeia contentType da busca → ConnectionTargetType dos favoritos. */
export function searchTypeToSavedType(contentType: string): string | null {
  switch (contentType) {
    case 'SOLUTION':
      return 'TECHNOLOGY';
    case 'PROJECT':
      return 'PROJECT';
    case 'ORGANIZATION':
      return 'ORGANIZATION';
    case 'FUNDER':
      return 'FUNDING_OFFER';
    case 'CHALLENGE':
      return 'CHALLENGE';
    case 'CASE':
      return 'SUCCESS_CASE';
    default:
      return null;
  }
}

/**
 * Carrega os favoritos do usuário logado no portal.
 * Revalida ao focar a janela (ex.: voltar do detalhe após “Gostei”).
 */
export function useSavedFavoriteKeys() {
  const { getAccessToken, loading: authLoading } = usePortalAuth();
  const [keys, setKeys] = useState<Set<string>>(() => new Set());
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  const reload = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setKeys(new Set());
      setIds(new Set());
      return;
    }
    try {
      const res = await fetch(`${urls.api}/api/saved-items`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setKeys(new Set());
        setIds(new Set());
        return;
      }
      const body = (await res.json()) as {
        items?: Array<{ targetType: string; targetId: string }>;
      };
      const nextKeys = new Set<string>();
      const nextIds = new Set<string>();
      for (const item of body.items ?? []) {
        nextKeys.add(savedFavoriteKey(item.targetType, item.targetId));
        nextIds.add(item.targetId);
      }
      setKeys(nextKeys);
      setIds(nextIds);
    } catch {
      setKeys(new Set());
      setIds(new Set());
    }
  }, [getAccessToken]);

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

  const isFavorited = useCallback(
    (contentType: string, id: string) => {
      const savedType = searchTypeToSavedType(contentType);
      if (savedType && keys.has(savedFavoriteKey(savedType, id))) return true;
      // fallback: UUID do item (caso o tipo da busca e do save divergirem)
      return ids.has(id);
    },
    [ids, keys],
  );

  return { isFavorited, reload, count: keys.size };
}
