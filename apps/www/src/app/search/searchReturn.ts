import type { SearchFilters } from '../api/searchApi';

const STORAGE_KEY = 'cac.search.return';

export const SEARCH_FILTER_KEYS: Array<keyof SearchFilters> = [
  'country',
  'region',
  'theme',
  'actorType',
  'sector',
  'maturity',
  'scale',
  'financing',
];

export type SearchReturnState = {
  /** pathname + search, e.g. `/search?q=seca&country=BR` */
  href: string;
  scrollY: number;
  savedAt: number;
};

export function filtersFromSearchParams(params: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};
  for (const key of SEARCH_FILTER_KEYS) {
    const value = params.get(key);
    if (value) {
      if (key === 'financing') {
        if (value === 'WITH_OPPORTUNITY' || value === 'ALL') filters.financing = value;
      } else {
        filters[key] = value;
      }
    }
  }
  return filters;
}

export function searchParamsFromState(query: string, filters: SearchFilters): URLSearchParams {
  const next = new URLSearchParams();
  const q = query.trim();
  if (q) next.set('q', q);
  for (const key of SEARCH_FILTER_KEYS) {
    const value = filters[key];
    if (value) next.set(key, String(value));
  }
  return next;
}

export function saveSearchReturn(href?: string, scrollY?: number) {
  try {
    const path =
      href ??
      `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (!path.startsWith('/search')) return;
    const state: SearchReturnState = {
      href: path,
      scrollY: scrollY ?? window.scrollY,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function readSearchReturn(): SearchReturnState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SearchReturnState;
    if (!parsed?.href?.startsWith('/search')) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getSearchReturnHref(fallback = '/search'): string {
  return readSearchReturn()?.href ?? fallback;
}

export function consumeSearchScroll(): number | null {
  const state = readSearchReturn();
  return state?.scrollY ?? null;
}
