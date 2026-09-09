import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { postSearch, type SearchFilters, type SearchResponse } from '../api/searchApi';
import { PageShell, ResultCard } from '../components/PageChrome';
import { FilterPanel } from '../components/search/FilterPanel';
import { MatchPaths } from '../components/search/MatchPaths';
import { ResultFacets } from '../components/search/ResultFacets';
import { normalizeLanguage } from '../../i18n';
import {
  consumeSearchScroll,
  filtersFromSearchParams,
  saveSearchReturn,
  searchParamsFromState,
} from '../search/searchReturn';

const STATIC_OPTIONS = {
  themes: [
    { value: 'ADAPTATION', label: 'Adaptação' },
    { value: 'MITIGATION', label: 'Mitigação' },
    { value: 'BOTH', label: 'Ambos' },
  ],
  actorTypes: [
    { value: 'pesquisa', label: 'ICT / pesquisa' },
    { value: 'empresa', label: 'Empresa' },
    { value: 'governo', label: 'Governo' },
    { value: 'local', label: 'Organização local' },
  ],
  sectors: [
    { value: 'pecuária', label: 'Pecuária' },
    { value: 'agricultura', label: 'Agricultura' },
    { value: 'água', label: 'Água' },
    { value: 'florestas', label: 'Florestas' },
  ],
  maturities: [
    { value: 'RESEARCH', label: 'Pesquisa' },
    { value: 'VALIDATION', label: 'Validação' },
    { value: 'DEMONSTRATION', label: 'Demonstração' },
    { value: 'READY_FOR_IMPLEMENTATION', label: 'Pronta para implementação' },
    { value: 'AT_SCALE', label: 'Em escala' },
  ],
  scales: [
    { value: 'local', label: 'Local' },
    { value: 'regional', label: 'Regional' },
    { value: 'nacional', label: 'Nacional' },
    { value: 'global', label: 'Global' },
  ],
  financing: [
    { value: 'ALL', label: 'Todos' },
    { value: 'WITH_OPPORTUNITY', label: 'Com oportunidade' },
  ],
  countries: [
    { value: 'BR', label: 'Brasil' },
    { value: 'NG', label: 'Nigéria' },
    { value: 'FR', label: 'França' },
    { value: 'NE', label: 'Níger' },
  ],
  regions: [
    { value: 'south_america', label: 'América do Sul' },
    { value: 'africa', label: 'África' },
    { value: 'europe', label: 'Europa' },
  ],
};

function contentLabel(type: string, t: (k: string) => string): string {
  switch (type) {
    case 'SOLUTION':
      return t('search.typeSolution');
    case 'PROJECT':
      return t('search.typeProject');
    case 'ORGANIZATION':
      return t('search.typeOrg');
    case 'FUNDER':
      return t('search.typeFunder');
    case 'CHALLENGE':
      return t('search.typeChallenge');
    default:
      return type;
  }
}

function filtersEqual(a: SearchFilters, b: SearchFilters) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key as keyof SearchFilters] !== b[key as keyof SearchFilters]) return false;
  }
  return true;
}

export function SearchPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const qParam = params.get('q') ?? '';
  const filters = useMemo(() => filtersFromSearchParams(params), [params]);
  const [query, setQuery] = useState(qParam);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const restoredScroll = useRef(false);

  const lang = normalizeLanguage(i18n.language);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    void postSearch({ query: qParam, filters, lang })
      .then((res) => {
        if (cancelled) return;
        setData(res);
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
  }, [qParam, filters, lang, t]);

  useEffect(() => {
    if (loading || !data || restoredScroll.current) return;
    const shouldRestore =
      (location.state as { restoreSearchScroll?: boolean } | null)?.restoreSearchScroll === true;
    if (!shouldRestore) return;
    const y = consumeSearchScroll();
    if (y == null) return;
    restoredScroll.current = true;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: 'auto' });
    });
  }, [loading, data, location.state]);

  useEffect(() => {
    saveSearchReturn(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  const interpretation = useMemo(() => {
    if (!data) return '';
    const i = data.interpretation;
    return t('search.interpretationLine', {
      challenge: i.challenge,
      context: i.context,
      sector: i.sector,
      intent: i.intent,
    });
  }, [data, t]);

  function commitSearch(nextQuery: string, nextFilters: SearchFilters) {
    setParams(searchParamsFromState(nextQuery, nextFilters), { replace: false });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    commitSearch(query, filters);
  }

  function onFiltersChange(next: SearchFilters) {
    if (filtersEqual(next, filters)) return;
    commitSearch(qParam, next);
  }

  return (
    <PageShell eyebrow={t('search.badge')} title={t('search.title')}>
      <p className="mb-4 max-w-[760px] text-[12px] leading-relaxed text-cac-muted">{t('search.support')}</p>

      <form onSubmit={onSubmit} className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('home.searchPlaceholder')}
          className="flex-1 rounded-[10px] border border-cac-line bg-white px-3 py-3 text-[11px] text-cac-ink"
        />
        <button
          type="submit"
          className="rounded-[10px] bg-cac-green2 px-4 py-3 text-[11px] font-black text-white"
        >
          {t('home.searchCta')}
        </button>
      </form>

      <FilterPanel
        value={filters}
        onChange={onFiltersChange}
        labels={{
          country: t('search.filters.country'),
          region: t('search.filters.region'),
          theme: t('search.filters.theme'),
          actorType: t('search.filters.actorType'),
          sector: t('search.filters.sector'),
          maturity: t('search.filters.maturity'),
          scale: t('search.filters.scale'),
          financing: t('search.filters.financing'),
        }}
        options={STATIC_OPTIONS}
      />

      {data ? (
        <div className="mt-4 rounded-[12px] border border-cac-line bg-[#eff7f3] px-3 py-2.5 text-[11px] text-cac-navy">
          <b>{t('search.interpretationBadge')}</b> {interpretation}
        </div>
      ) : null}

      {error ? <p className="mt-3 text-[11px] text-red-700">{error}</p> : null}
      {loading ? <p className="mt-3 text-[11px] text-cac-muted">{t('detail.loading')}</p> : null}

      {data ? (
        <>
          <ResultFacets
            total={data.total}
            facets={data.facets}
            labels={{
              results: t('search.facets.results'),
              solutions: t('search.facets.solutions'),
              projects: t('search.facets.projects'),
              organizations: t('search.facets.organizations'),
              funders: t('search.facets.funders'),
              cases: t('search.facets.cases'),
              challenges: t('search.facets.challenges'),
            }}
          />

          <div className="mt-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-[0.95rem] font-black text-cac-navy">{t('search.resultsTitle')}</h2>
                <p className="mt-0.5 text-[0.7rem] text-cac-muted">
                  {t('search.resultsHint', { count: data.results.length, total: data.total })}
                </p>
              </div>
              {data.meta?.minScore != null ? (
                <p className="text-[0.65rem] text-cac-muted">
                  {t('search.minScoreHint', { score: data.meta.minScore })}
                </p>
              ) : null}
            </div>

            <div className="space-y-2.5">
              {data.results.map((item) => (
                <ResultCard
                  key={item.id}
                  to={item.href}
                  onNavigate={() =>
                    saveSearchReturn(`${location.pathname}${location.search}`, window.scrollY)
                  }
                  title={item.title}
                  summary={item.summary}
                  meta={[
                    contentLabel(item.contentType, t),
                    item.organizationName,
                    item.country,
                    item.region,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  tags={item.tags}
                  score={`${item.score}%`}
                  factors={item.factors}
                />
              ))}
              {!data.results.length ? (
                <p className="rounded-[12px] border border-dashed border-cac-line bg-white px-4 py-6 text-[0.75rem] text-cac-muted">
                  {t('detail.emptyList')}
                </p>
              ) : null}
            </div>
          </div>

          <MatchPaths
            paths={data.paths}
            labels={{
              title: t('search.pathsTitle'),
              solve: t('search.paths.solve'),
              fund: t('search.paths.fund'),
              projects: t('search.paths.projects'),
              empty: t('search.paths.empty'),
              active: t('search.paths.active'),
              directory: t('search.paths.directory'),
            }}
          />
        </>
      ) : null}
    </PageShell>
  );
}
