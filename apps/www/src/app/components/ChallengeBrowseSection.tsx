import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalogApi, type Challenge } from '../api/catalogApi';
import { shell } from './PageChrome';
import { needTypeLabel } from '../lib/needTypeLabel';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { useSavedFavoriteKeys } from '../hooks/useSavedFavoriteKeys';

const PAGE_SIZE = 9;

const NEED_TYPES = [
  'TECHNOLOGY',
  'KNOWLEDGE',
  'PARTNERSHIP',
  'FUNDING',
  'TRAINING',
  'RESEARCH',
  'EQUIPMENT',
] as const;

const THEMES = [
  { value: 'água', labelKey: 'challengeLanding.filterThemeWater' },
  { value: 'seca', labelKey: 'challengeLanding.filterThemeDrought' },
  { value: 'pastagem', labelKey: 'challengeLanding.filterThemePasture' },
  { value: 'agrofloresta', labelKey: 'challengeLanding.filterThemeAgroforestry' },
  { value: 'financiamento', labelKey: 'challengeLanding.filterThemeFunding' },
  { value: 'adaptação', labelKey: 'challengeLanding.filterThemeAdaptation' },
] as const;

const SECTORS = [
  { value: 'pecuária', labelKey: 'challengeLanding.filterSectorLivestock' },
  { value: 'agricultura', labelKey: 'challengeLanding.filterSectorAgriculture' },
  { value: 'água', labelKey: 'challengeLanding.filterSectorWater' },
  { value: 'florestas', labelKey: 'challengeLanding.filterSectorForests' },
] as const;

const COUNTRY_LABELS: Record<string, string> = {
  BR: 'Brasil',
  NG: 'Nigéria',
  NE: 'Níger',
  MZ: 'Moçambique',
  FR: 'França',
};

type SortKey = 'recent' | 'title_asc' | 'title_desc';
type ViewMode = 'grid' | 'list';

function matchesText(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function challengeHaystack(item: Challenge) {
  return [item.title, item.summary, item.context ?? '', ...(item.tags ?? [])].join(' ');
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full min-w-[7.5rem] rounded-lg border border-cac-line bg-white px-2.5 py-2 text-pequena outline-none ${
          value ? 'text-cac-ink' : 'text-cac-muted'
        }`}
      >
        <option value="">{label}</option>
        {children}
      </select>
    </label>
  );
}

export function ChallengeBrowseSection() {
  const { t } = useTranslation();
  const { isFavorited } = useSavedFavoriteKeys();
  const [items, setItems] = useState<Challenge[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [theme, setTheme] = useState('');
  const [sector, setSector] = useState('');
  const [needType, setNeedType] = useState('');
  const [region, setRegion] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('recent');
  const [view, setView] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void catalogApi
      .listChallenges()
      .then((res) => {
        if (!cancelled) {
          setItems(res.items);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('detail.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.country) set.add(item.country);
    }
    return [...set].sort();
  }, [items]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.region) set.add(item.region);
    }
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    let next = items.slice();

    if (query.trim()) {
      const q = query.trim();
      next = next.filter((item) => matchesText(challengeHaystack(item), q));
    }
    if (country) next = next.filter((item) => item.country === country);
    if (region) next = next.filter((item) => item.region === region);
    if (needType) next = next.filter((item) => item.needType === needType);
    if (theme) {
      next = next.filter((item) => matchesText(challengeHaystack(item), theme));
    }
    if (sector) {
      next = next.filter((item) => matchesText(challengeHaystack(item), sector));
    }

    next.sort((a, b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      if (sort === 'title_desc') return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
      const aTime = Date.parse(a.updatedAt || a.createdAt || '') || 0;
      const bTime = Date.parse(b.updatedAt || b.createdAt || '') || 0;
      return bTime - aTime;
    });

    return next;
  }, [items, query, country, region, needType, theme, sector, sort]);

  useEffect(() => {
    setPage(1);
  }, [query, country, region, needType, theme, sector, sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, total);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function countryLabel(code: string) {
    return COUNTRY_LABELS[code] ?? code;
  }

  function regionLabel(value: string) {
    const map: Record<string, string> = {
      africa: t('challengeLanding.regionAfrica'),
      asia: t('challengeLanding.regionAsia'),
      europe: t('challengeLanding.regionEurope'),
      north_america: t('challengeLanding.regionNorthAmerica'),
      south_america: t('challengeLanding.regionSouthAmerica'),
      oceania: t('challengeLanding.regionOceania'),
    };
    return map[value] ?? value.replace(/_/g, ' ');
  }

  return (
    <section className={`${shell} py-8 md:py-10`}>
      <div className="rounded-[16px] border border-cac-line bg-white p-3 shadow-[0_10px_28px_rgba(10,36,64,.06)] sm:p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t('challengeLanding.searchPlaceholder')}</span>
            <i
              className="fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-cac-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('challengeLanding.searchPlaceholder')}
              className="w-full rounded-lg border border-cac-line bg-[#fbfcfb] py-2.5 pr-3 pl-9 text-pequena text-cac-navy outline-none placeholder:text-cac-muted focus:border-cac-green/50"
            />
          </label>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center">
            <FilterSelect label={t('search.filters.country')} value={country} onChange={setCountry}>
              {countries.map((code) => (
                <option key={code} value={code}>
                  {countryLabel(code)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label={t('challengeLanding.filterTheme')} value={theme} onChange={setTheme}>
              {THEMES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label={t('challengeLanding.filterSector')} value={sector} onChange={setSector}>
              {SECTORS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              label={t('challengeLanding.filterNeedType')}
              value={needType}
              onChange={setNeedType}
            >
              {NEED_TYPES.map((value) => (
                <option key={value} value={value}>
                  {needTypeLabel(value, t)}
                </option>
              ))}
            </FilterSelect>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-pequena font-bold transition ${
                moreOpen || region
                  ? 'border-cac-green/40 bg-[#eff7f3] text-cac-green'
                  : 'border-cac-line bg-white text-cac-navy hover:border-cac-green/30'
              }`}
            >
              <i className="fa-solid fa-sliders" aria-hidden />
              {t('challengeLanding.moreFilters')}
            </button>
          </div>
        </div>

        {moreOpen ? (
          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-cac-line pt-3 sm:grid-cols-2 lg:max-w-md">
            <FilterSelect label={t('search.filters.region')} value={region} onChange={setRegion}>
              {regions.map((value) => (
                <option key={value} value={value}>
                  {regionLabel(value)}
                </option>
              ))}
            </FilterSelect>
          </div>
        ) : null}
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-grande font-bold tracking-[-0.4px] text-cac-navy">
            {t('challengeLanding.listTitle', { count: total })}
          </h2>
          <p className="mt-1 text-pequena text-cac-muted">{t('challengeLanding.listSupport')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-pequena text-cac-muted">
            <span>{t('challengeLanding.sortLabel')}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-cac-line bg-white px-2.5 py-1.5 text-pequena font-bold text-cac-navy outline-none"
            >
              <option value="recent">{t('challengeLanding.sortRecent')}</option>
              <option value="title_asc">{t('challengeLanding.sortTitleAsc')}</option>
              <option value="title_desc">{t('challengeLanding.sortTitleDesc')}</option>
            </select>
          </label>
          <div className="inline-flex overflow-hidden rounded-lg border border-cac-line">
            <button
              type="button"
              aria-label={t('challengeLanding.viewGrid')}
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
              className={`grid size-9 place-items-center ${
                view === 'grid' ? 'bg-cac-green2 text-white' : 'bg-white text-cac-muted'
              }`}
            >
              <i className="fa-solid fa-grip" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t('challengeLanding.viewList')}
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
              className={`grid size-9 place-items-center border-l border-cac-line ${
                view === 'list' ? 'bg-cac-green2 text-white' : 'bg-white text-cac-muted'
              }`}
            >
              <i className="fa-solid fa-list" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-2 text-mini text-cac-muted">
        {loading
          ? t('detail.loading')
          : t('challengeLanding.showingRange', { start, end, total })}
      </p>

      {error ? <p className="mt-3 text-pequena text-red-700">{error}</p> : null}

      <div
        className={
          view === 'grid'
            ? 'mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
            : 'mt-4 flex flex-col gap-3'
        }
      >
        {pageItems.map((item) => {
          const cover = resolveMediaUrl(item.coverImageUrl);
          const favorited = isFavorited('CHALLENGE', item.id);
          return (
            <Link
              key={item.id}
              to={`/challenges/${item.slug}`}
              className={`group overflow-hidden rounded-[16px] border border-cac-line bg-white shadow-[0_14px_38px_rgba(10,36,64,.08)] transition hover:-translate-y-0.5 hover:border-cac-green/35 ${
                view === 'list' ? 'grid gap-0 sm:grid-cols-[14rem_minmax(0,1fr)]' : 'flex flex-col'
              }`}
            >
              <div
                className={`relative overflow-hidden bg-gradient-to-br from-[#b8d7bf] to-[#dce9d3] ${
                  view === 'list' ? 'min-h-[9rem] sm:h-full' : 'h-[140px]'
                }`}
              >
                {cover ? (
                  <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
                <span className="absolute top-2.5 left-2.5 rounded-full bg-[#1f6b4a] px-2.5 py-1 text-mini font-extrabold text-white">
                  {t('challengeLanding.statusOpen')}
                </span>
                {favorited ? (
                  <span
                    className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-white/95 text-[#e11d48] shadow-sm"
                    title={t('detail.favorited')}
                  >
                    <i className="fa-solid fa-heart text-[0.95rem]" aria-hidden />
                  </span>
                ) : (
                  <span className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-white/90 text-cac-muted shadow-sm">
                    <i className="fa-regular fa-heart text-[0.95rem]" aria-hidden />
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-media font-bold leading-snug text-cac-navy group-hover:text-cac-green">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-pequena leading-relaxed text-cac-muted">
                  {item.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-mini text-cac-muted">
                  {item.country ? (
                    <span className="inline-flex items-center gap-1.5">
                      <i className="fa-solid fa-location-dot text-cac-green" aria-hidden />
                      {countryLabel(item.country)}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <i className="fa-solid fa-tag text-cac-green" aria-hidden />
                    {needTypeLabel(item.needType, t)}
                  </span>
                </div>
                {item.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-cac-green3 px-2 py-1 text-mini font-extrabold text-cac-green"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>

      {!loading && !pageItems.length ? (
        <p className="mt-4 rounded-[12px] border border-dashed border-cac-line bg-white px-4 py-6 text-pequena text-cac-muted">
          {t('challengeLanding.emptyList')}
        </p>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-2 rounded-[10px] border border-cac-line bg-white px-3 py-2 text-pequena font-bold text-cac-navy disabled:opacity-40"
          >
            <i className="fa-solid fa-chevron-left text-[0.75rem]" aria-hidden />
            {t('challengeLanding.prevPage')}
          </button>
          <span className="px-2 text-pequena text-cac-muted">
            {t('challengeLanding.pageOf', { page: safePage, total: totalPages })}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-2 rounded-[10px] border border-cac-line bg-white px-3 py-2 text-pequena font-bold text-cac-navy disabled:opacity-40"
          >
            {t('challengeLanding.nextPage')}
            <i className="fa-solid fa-chevron-right text-[0.75rem]" aria-hidden />
          </button>
        </div>
      ) : null}
    </section>
  );
}
