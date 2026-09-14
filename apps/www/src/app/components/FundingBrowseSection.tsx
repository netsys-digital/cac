import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@cac/shared';
import { fundingApi, type FundingOffer, type FunderProfile } from '../api/fundingApi';
import { shell } from './PageChrome';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { useSavedFavoriteKeys } from '../hooks/useSavedFavoriteKeys';

const PAGE_SIZE = 9;

const COUNTRY_LABELS: Record<string, string> = {
  BR: 'Brasil',
  NG: 'Nigéria',
  NE: 'Níger',
  MZ: 'Moçambique',
  FR: 'França',
};

type SortKey = 'recent' | 'deadline' | 'title_asc' | 'title_desc';
type ViewMode = 'grid' | 'list';
type DeadlineFilter = '' | 'with' | 'open';

function matchesText(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
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

function countryLabel(code: string) {
  return COUNTRY_LABELS[code] ?? code;
}

export function FundingBrowseSection() {
  const { t, i18n } = useTranslation();
  const { isFavorited } = useSavedFavoriteKeys();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'directory' ? 'directory' : 'active';

  const [offers, setOffers] = useState<FundingOffer[]>([]);
  const [funders, setFunders] = useState<FunderProfile[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('recent');
  const [view, setView] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([fundingApi.listOffers(true), fundingApi.listFunders()])
      .then(([o, f]) => {
        if (cancelled) return;
        setOffers(o.items);
        setFunders(f.items);
        setError('');
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
  }, [t, i18n.language]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    const source = tab === 'active' ? offers : funders;
    for (const item of source) {
      if (item.country) set.add(item.country);
    }
    return [...set].sort();
  }, [offers, funders, tab]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    const source = tab === 'active' ? offers : funders;
    for (const item of source) {
      if (item.region) set.add(item.region);
    }
    return [...set].sort();
  }, [offers, funders, tab]);

  const filteredOffers = useMemo(() => {
    let next = offers.slice();
    if (query.trim()) {
      const q = query.trim();
      next = next.filter((item) =>
        matchesText(
          [item.title, item.summary, item.whatFunds ?? '', item.criteria ?? '', item.amountRange ?? ''].join(' '),
          q,
        ),
      );
    }
    if (country) next = next.filter((item) => item.country === country);
    if (region) next = next.filter((item) => item.region === region);
    if (deadlineFilter === 'with') next = next.filter((item) => Boolean(item.deadline));
    if (deadlineFilter === 'open') next = next.filter((item) => !item.deadline);

    next.sort((a, b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      if (sort === 'title_desc') return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
      if (sort === 'deadline') {
        const aD = a.deadline ? Date.parse(a.deadline) : Number.POSITIVE_INFINITY;
        const bD = b.deadline ? Date.parse(b.deadline) : Number.POSITIVE_INFINITY;
        return aD - bD;
      }
      return 0;
    });
    return next;
  }, [offers, query, country, region, deadlineFilter, sort]);

  const filteredFunders = useMemo(() => {
    let next = funders.slice();
    if (query.trim()) {
      const q = query.trim();
      next = next.filter((item) => matchesText([item.name, item.summary].join(' '), q));
    }
    if (country) next = next.filter((item) => item.country === country);
    if (region) next = next.filter((item) => item.region === region);

    next.sort((a, b) => {
      if (sort === 'title_desc') return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    return next;
  }, [funders, query, country, region, sort]);

  const filtered = tab === 'active' ? filteredOffers : filteredFunders;

  useEffect(() => {
    setPage(1);
  }, [query, country, region, deadlineFilter, sort, tab]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, total);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function regionLabel(value: string) {
    const map: Record<string, string> = {
      africa: t('funding.regionAfrica'),
      asia: t('funding.regionAsia'),
      europe: t('funding.regionEurope'),
      north_america: t('funding.regionNorthAmerica'),
      south_america: t('funding.regionSouthAmerica'),
      oceania: t('funding.regionOceania'),
    };
    return map[value] ?? value.replace(/_/g, ' ');
  }

  return (
    <section className={`${shell} py-8 pb-16 md:py-10 md:pb-[4rem]`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-[10px] px-3.5 py-2 text-pequena font-bold ${
            tab === 'active' ? 'bg-cac-green2 text-white' : 'border border-cac-line bg-white text-cac-navy'
          }`}
          onClick={() => setParams({ tab: 'active' })}
        >
          {t('funding.activeTitle')}
        </button>
        <button
          type="button"
          className={`rounded-[10px] px-3.5 py-2 text-pequena font-bold ${
            tab === 'directory' ? 'bg-cac-green2 text-white' : 'border border-cac-line bg-white text-cac-navy'
          }`}
          onClick={() => setParams({ tab: 'directory' })}
        >
          {t('funding.directoryTitle')}
        </button>
      </div>

      <div className="rounded-[16px] border border-cac-line bg-white p-3 shadow-[0_10px_28px_rgba(10,36,64,.06)] sm:p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t('funding.searchPlaceholder')}</span>
            <i
              className="fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-cac-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === 'active' ? t('funding.searchPlaceholder') : t('funding.searchFundersPlaceholder')
              }
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
            <FilterSelect label={t('search.filters.region')} value={region} onChange={setRegion}>
              {regions.map((value) => (
                <option key={value} value={value}>
                  {regionLabel(value)}
                </option>
              ))}
            </FilterSelect>
            {tab === 'active' ? (
              <FilterSelect
                label={t('funding.filterDeadline')}
                value={deadlineFilter}
                onChange={(v) => setDeadlineFilter(v as DeadlineFilter)}
              >
                <option value="with">{t('funding.filterDeadlineWith')}</option>
                <option value="open">{t('funding.filterDeadlineOpen')}</option>
              </FilterSelect>
            ) : null}
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-pequena font-bold transition ${
                moreOpen
                  ? 'border-cac-green/40 bg-[#eff7f3] text-cac-green'
                  : 'border-cac-line bg-white text-cac-navy hover:border-cac-green/30'
              }`}
            >
              <i className="fa-solid fa-sliders" aria-hidden />
              {t('funding.moreFilters')}
            </button>
          </div>
        </div>

        {moreOpen ? (
          <p className="mt-3 border-t border-cac-line pt-3 text-pequena text-cac-muted">
            {tab === 'active' ? t('funding.activeBody') : t('funding.directoryBody')}
          </p>
        ) : null}
      </div>

      {tab === 'directory' ? (
        <div className="mt-4 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-pequena text-amber-900">
          {t('funding.directoryWarning')}
        </div>
      ) : null}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-grande font-bold tracking-[-0.4px] text-cac-navy">
            {tab === 'active'
              ? t('funding.listTitleOffers', { count: total })
              : t('funding.listTitleFunders', { count: total })}
          </h2>
          <p className="mt-1 text-pequena text-cac-muted">
            {tab === 'active' ? t('funding.listSupportOffers') : t('funding.listSupportFunders')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-pequena text-cac-muted">
            <span>{t('funding.sortLabel')}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-cac-line bg-white px-2.5 py-1.5 text-pequena font-bold text-cac-navy outline-none"
            >
              {tab === 'active' ? (
                <>
                  <option value="recent">{t('funding.sortRecent')}</option>
                  <option value="deadline">{t('funding.sortDeadline')}</option>
                </>
              ) : null}
              <option value="title_asc">{t('funding.sortTitleAsc')}</option>
              <option value="title_desc">{t('funding.sortTitleDesc')}</option>
            </select>
          </label>
          <div className="inline-flex overflow-hidden rounded-lg border border-cac-line">
            <button
              type="button"
              aria-label={t('funding.viewGrid')}
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
              aria-label={t('funding.viewList')}
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
        {loading ? t('detail.loading') : t('funding.showingRange', { start, end, total })}
      </p>

      {error ? <p className="mt-3 text-pequena text-red-700">{error}</p> : null}

      <div
        className={
          view === 'grid'
            ? 'mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
            : 'mt-4 flex flex-col gap-3'
        }
      >
        {tab === 'active'
          ? (pageItems as FundingOffer[]).map((offer) => {
              const cover = resolveMediaUrl(offer.coverImageUrl);
              const favorited = isFavorited('FUNDER', offer.id);
              return (
                <Link
                  key={offer.id}
                  to={`/funding/${offer.slug}`}
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
                      {t('funding.statusActive')}
                    </span>
                    {favorited ? (
                      <span className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-white/95 text-[#e11d48] shadow-sm">
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
                      {offer.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-pequena leading-relaxed text-cac-muted">
                      {offer.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-mini text-cac-muted">
                      {offer.country ? (
                        <span className="inline-flex items-center gap-1.5">
                          <i className="fa-solid fa-location-dot text-cac-green" aria-hidden />
                          {countryLabel(offer.country)}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5">
                        <i className="fa-solid fa-calendar text-cac-green" aria-hidden />
                        {offer.deadline
                          ? `${t('funding.deadline')}: ${formatDate(offer.deadline, i18n.language)}`
                          : t('funding.noDeadline')}
                      </span>
                    </div>
                    {offer.amountRange ? (
                      <p className="mt-2 text-mini font-bold text-cac-navy">{offer.amountRange}</p>
                    ) : null}
                    {offer.organization ? (
                      <p className="mt-1 text-mini font-bold text-cac-green">{offer.organization.name}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })
          : (pageItems as FunderProfile[]).map((funder) => (
              <article
                key={funder.id}
                className={`flex h-full flex-col rounded-[16px] border border-cac-line bg-white p-4 shadow-[0_14px_38px_rgba(10,36,64,.08)] ${
                  view === 'list' ? 'sm:flex-row sm:items-start sm:gap-4' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-media font-bold text-cac-navy">{funder.name}</h3>
                  <p className="mt-2 text-pequena leading-relaxed text-cac-muted">{funder.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-mini text-cac-muted">
                    {funder.country ? (
                      <span className="inline-flex items-center gap-1.5">
                        <i className="fa-solid fa-location-dot text-cac-green" aria-hidden />
                        {countryLabel(funder.country)}
                      </span>
                    ) : null}
                    {funder.region ? (
                      <span className="inline-flex items-center gap-1.5">
                        <i className="fa-solid fa-globe text-cac-green" aria-hidden />
                        {regionLabel(funder.region)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
      </div>

      {!loading && !pageItems.length ? (
        <p className="mt-4 rounded-[12px] border border-dashed border-cac-line bg-white px-4 py-6 text-pequena text-cac-muted">
          {t('funding.emptyList')}
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
            {t('funding.prevPage')}
          </button>
          <span className="px-2 text-pequena text-cac-muted">
            {t('funding.pageOf', { page: safePage, total: totalPages })}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-2 rounded-[10px] border border-cac-line bg-white px-3 py-2 text-pequena font-bold text-cac-navy disabled:opacity-40"
          >
            {t('funding.nextPage')}
            <i className="fa-solid fa-chevron-right text-[0.75rem]" aria-hidden />
          </button>
        </div>
      ) : null}

      <Link to="/search" className="mt-6 inline-block text-pequena font-bold text-cac-green">
        {t('detail.backSearch')}
      </Link>
    </section>
  );
}
