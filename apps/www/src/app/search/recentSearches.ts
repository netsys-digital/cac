const STORAGE_KEY = 'cac.search.recent';
const MAX_ITEMS = 8;

export type RecentSearchItem = {
  query: string;
  hint: string;
};

export function readRecentSearches(): RecentSearchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearchItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item?.query && typeof item.query === 'string')
      .map((item) => ({
        query: item.query.trim(),
        hint: typeof item.hint === 'string' && item.hint.trim() ? item.hint.trim() : '',
      }))
      .filter((item) => item.query.length > 0)
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function pushRecentSearch(item: RecentSearchItem) {
  const query = item.query.trim();
  if (!query) return;
  const next: RecentSearchItem[] = [
    { query, hint: item.hint.trim() },
    ...readRecentSearches().filter((x) => x.query.toLowerCase() !== query.toLowerCase()),
  ].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}
