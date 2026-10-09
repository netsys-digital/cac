import { useEffect } from 'react';
import { urls } from '../../config';

export type ViewTargetType = 'TECHNOLOGY' | 'CHALLENGE' | 'FUNDING_OFFER' | 'SUCCESS_CASE';

const VISITOR_KEY = 'cac:visitor-id';

function randomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function visitorId(): string | undefined {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = randomUuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

/** Registra uma visualização da publicação; a API deduplica por visitante/dia. */
export function useTrackView(targetType: ViewTargetType, targetId: string | undefined) {
  useEffect(() => {
    if (!targetId) return;
    const sessionKey = `cac:viewed:${targetType}:${targetId}`;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, '1');
    } catch {
      // sessionStorage indisponível: a API ainda deduplica.
    }
    void fetch(`${urls.api}/api/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, targetId, visitorId: visitorId() }),
      keepalive: true,
    }).catch(() => undefined);
  }, [targetType, targetId]);
}
