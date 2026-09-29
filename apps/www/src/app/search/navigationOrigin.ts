import { useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORAGE_KEY = 'cac.nav.origins';
const MAX_ENTRIES = 60;

type OriginMap = Record<string, string>;

function load(): OriginMap {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OriginMap) : {};
  } catch {
    return {};
  }
}

function save(map: OriginMap) {
  try {
    const keys = Object.keys(map);
    const trimmed =
      keys.length > MAX_ENTRIES
        ? Object.fromEntries(keys.slice(-MAX_ENTRIES).map((k) => [k, map[k]]))
        : map;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore quota / private mode
  }
}

/** URL interna (pathname + search) de onde o usuário chegou à entrada de histórico `key`. */
export function getNavigationOrigin(key: string): string | null {
  return load()[key] ?? null;
}

/**
 * Registra a origem de cada entrada do histórico. Roda durante o render do layout (e não em
 * efeito) porque as páginas filhas leem a origem no mesmo ciclo de render.
 */
export function useTrackNavigationOrigin() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previous = useRef<{ key: string; href: string } | null>(null);

  const href = `${location.pathname}${location.search}`;
  const last = previous.current;
  if (last?.key !== location.key) {
    if (last) {
      const map = load();
      if (navigationType === 'PUSH') {
        map[location.key] = last.href;
        save(map);
      } else if (navigationType === 'REPLACE' && map[last.key] && !map[location.key]) {
        map[location.key] = map[last.key];
        save(map);
      }
    }
    previous.current = { key: location.key, href };
  } else if (last.href !== href) {
    previous.current = { key: location.key, href };
  }
}
