import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, useDialog } from '@cac/ui';
import { formatDateTime } from '@cac/shared';
import { useAuth } from '../../auth/AuthContext';
import {
  myContentsApi,
  type ContentKind,
  type ContentMetrics,
  type MyContentItem,
} from '../../api/myContentsApi';

const KINDS: Array<ContentKind | 'ALL'> = [
  'ALL',
  'TECHNOLOGY',
  'CHALLENGE',
  'FUNDING_OFFER',
  'SUCCESS_CASE',
];

const STATUSES = ['ALL', 'DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
type SortKey = 'recent' | 'title' | 'likes' | 'connections';

const emptyMetrics: ContentMetrics = {
  likes: 0,
  connections: 0,
  connectionsPending: 0,
  contacts: 0,
  views: 0,
  viewsTracked: false,
};

function statusClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-cac-green3 text-cac-navy';
  if (status === 'IN_REVIEW') return 'bg-amber-100 text-amber-900';
  if (status === 'ARCHIVED') return 'bg-red-100 text-red-900';
  return 'bg-[#edf1f3] text-cac-muted';
}

function curationNoteLabel(status: string, t: (key: string) => string) {
  if (status === 'ARCHIVED') return t('mine.curationNoteRejected');
  if (status === 'DRAFT') return t('mine.curationNoteReturned');
  if (status === 'PUBLISHED') return t('mine.curationNoteApproved');
  return t('mine.curationNoteTitle');
}

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div
      className="min-w-[4.5rem] shrink-0 rounded-xl border border-cac-line bg-[#f7faf8] px-2 py-2 text-center"
      title={hint}
    >
      <p className="text-media font-bold leading-none text-cac-navy">{value}</p>
      <p className="mt-1 text-mini font-bold uppercase tracking-wide text-cac-muted">{label}</p>
    </div>
  );
}

export function MyContentsPage() {
  const { t, i18n } = useTranslation();
  const { accessToken } = useAuth();
  const dialog = useDialog();
  const [items, setItems] = useState<MyContentItem[]>([]);
  const [counts, setCounts] = useState({ DRAFT: 0, IN_REVIEW: 0, PUBLISHED: 0, ARCHIVED: 0 });
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [kind, setKind] = useState<(typeof KINDS)[number]>('ALL');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('ALL');
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [organizationId, setOrganizationId] = useState('ALL');
  const [country, setCountry] = useState('ALL');
  const [sort, setSort] = useState<SortKey>('recent');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setQDebounced(q.trim()), 250);
    return () => window.clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await myContentsApi.list(accessToken, {
        kind: kind === 'ALL' ? undefined : kind,
        status: status === 'ALL' ? undefined : status,
        q: qDebounced || undefined,
        organizationId: organizationId === 'ALL' ? undefined : organizationId,
        country: country === 'ALL' ? undefined : country,
      });
      setItems(
        res.items.map((item) => ({
          ...item,
          metrics: item.metrics ?? emptyMetrics,
        })),
      );
      setCounts({
        DRAFT: res.counts?.DRAFT ?? 0,
        IN_REVIEW: res.counts?.IN_REVIEW ?? 0,
        PUBLISHED: res.counts?.PUBLISHED ?? 0,
        ARCHIVED: res.counts?.ARCHIVED ?? 0,
      });
      setOrganizations(res.facets?.organizations ?? []);
      setCountries(res.facets?.countries ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, kind, status, qDebounced, organizationId, country]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedItems = useMemo(() => {
    const next = [...items];
    next.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'likes') return (b.metrics?.likes ?? 0) - (a.metrics?.likes ?? 0);
      if (sort === 'connections') return (b.metrics?.connections ?? 0) - (a.metrics?.connections ?? 0);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return next;
  }, [items, sort]);

  async function withdraw(item: MyContentItem) {
    if (!accessToken) return;
    setMessage('');
    try {
      await myContentsApi.withdraw(accessToken, item.kind, item.id);
      setMessage(t('mine.withdrawn'));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    }
  }

  async function remove(item: MyContentItem) {
    if (!accessToken) return;
    const ok = await dialog.confirm({
      title: t('mine.delete'),
      message: t('mine.confirmDelete'),
      confirmLabel: t('mine.delete'),
      tone: 'danger',
    });
    if (!ok) return;
    setMessage('');
    try {
      await myContentsApi.remove(accessToken, item.kind, item.id);
      setMessage(t('mine.deleted'));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    }
  }

  function clearFilters() {
    setKind('ALL');
    setStatus('ALL');
    setQ('');
    setOrganizationId('ALL');
    setCountry('ALL');
    setSort('recent');
  }

  const hasActiveFilters =
    kind !== 'ALL' ||
    status !== 'ALL' ||
    qDebounced.length > 0 ||
    organizationId !== 'ALL' ||
    country !== 'ALL';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-pequena font-extrabold tracking-[1.7px] text-cac-green uppercase">{t('mine.badge')}</p>
          <h1 className="mt-2 text-grande font-bold text-cac-navy">{t('mine.title')}</h1>
          <p className="mt-2 max-w-[780px] text-media leading-relaxed text-cac-muted">{t('mine.desc')}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-pequena font-bold">
          {(['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(status === s ? 'ALL' : s)}
              className={`rounded-full px-3 py-1.5 transition ${
                status === s ? 'ring-2 ring-cac-navy/30 ' : ''
              } ${statusClass(s)}`}
            >
              {t(`mine.status.${s}`)} {counts[s] ?? 0}
            </button>
          ))}
        </div>
      </header>

      <section className="space-y-3 rounded-[18px] border border-cac-line bg-white p-4 shadow-cac md:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('mine.filters.search')}
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('mine.filters.searchPlaceholder')}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            />
          </label>
          <label className="min-w-[180px]">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('mine.filters.organization')}
            </span>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            >
              <option value="ALL">{t('mine.filters.allOrgs')}</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[140px]">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('mine.filters.country')}
            </span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            >
              <option value="ALL">{t('mine.filters.allCountries')}</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[150px]">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('mine.filters.sort')}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            >
              <option value="recent">{t('mine.filters.sortRecent')}</option>
              <option value="title">{t('mine.filters.sortTitle')}</option>
              <option value="likes">{t('mine.filters.sortLikes')}</option>
              <option value="connections">{t('mine.filters.sortConnections')}</option>
            </select>
          </label>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-cac-line px-3.5 py-2.5 text-media font-extrabold text-cac-muted hover:bg-cac-bg"
            >
              {t('mine.filters.clear')}
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
          <span className="mr-1 text-pequena font-bold uppercase tracking-wide text-cac-muted">
            {t('mine.filters.kind')}
          </span>
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-xl px-3.5 py-2 text-media font-extrabold ${
                kind === k ? 'bg-cac-navy text-white' : 'border border-cac-line bg-white text-cac-muted'
              }`}
            >
              {t(`mine.kind.${k}`)}
            </button>
          ))}
          <span className="mx-4 hidden h-7 w-px bg-cac-line sm:block" aria-hidden />
          <span className="mr-1 text-pequena font-bold uppercase tracking-wide text-cac-muted sm:ml-1">
            {t('mine.filters.status')}
          </span>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-xl px-3.5 py-2 text-media font-extrabold ${
                status === s ? 'bg-cac-green3 text-cac-navy' : 'border border-cac-line bg-white text-cac-muted'
              }`}
            >
              {t(`mine.status.${s}`)}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-media text-red-800">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-cac-green/30 bg-cac-green3 px-3 py-2 text-media text-cac-navy">
          {message}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[18px] border border-cac-line bg-white shadow-cac">
        {loading ? (
          <p className="p-6 text-media text-cac-muted">{t('mine.loading')}</p>
        ) : sortedItems.length === 0 ? (
          <div className="space-y-3 p-7">
            <p className="text-media text-cac-muted">{t('mine.empty')}</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/catalog/technologies/new">
                <Button>{t('nav.newTech')}</Button>
              </Link>
              <Link to="/catalog/challenges/new">
                <Button variant="secondary">{t('nav.newChallenge')}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-cac-line">
            {sortedItems.map((item) => {
              const m = item.metrics ?? emptyMetrics;
              return (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1.2fr)_auto_auto] md:items-center md:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#edf1f3] px-2 py-0.5 text-pequena font-bold tracking-wide text-cac-muted">
                        {t(`mine.kind.${item.kind}`)}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-pequena font-bold ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-media font-bold text-cac-navy">{item.title}</p>
                    <p className="mt-0.5 text-pequena text-cac-muted">
                      {item.organizationName} · {item.country} ·{' '}
                      {formatDateTime(item.updatedAt, i18n.language)}
                    </p>
                    {item.curationNote ? (
                      <p className="mt-2 rounded-lg border border-cac-line bg-[#fbfcfb] px-2.5 py-2 text-pequena leading-snug text-cac-navy">
                        <span className="font-bold">{curationNoteLabel(item.status, t)}: </span>
                        {item.curationNote}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-nowrap gap-2 overflow-x-auto pb-0.5">
                    <MetricCard label={t('mine.metrics.likes')} value={m.likes} hint={t('mine.metrics.likesHint')} />
                    <MetricCard
                      label={t('mine.metrics.connections')}
                      value={m.connections}
                      hint={t('mine.metrics.connectionsHint')}
                    />
                    <MetricCard
                      label={t('mine.metrics.pending')}
                      value={m.connectionsPending}
                      hint={t('mine.metrics.pendingHint')}
                    />
                    <MetricCard
                      label={t('mine.metrics.contacts')}
                      value={m.contacts}
                      hint={t('mine.metrics.contactsHint')}
                    />
                    <MetricCard
                      label={t('mine.metrics.views')}
                      value={m.viewsTracked ? m.views : '—'}
                      hint={t('mine.metrics.viewsHint')}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Link to={item.editPath}>
                      <Button variant="secondary">{t('mine.edit')}</Button>
                    </Link>
                    {item.status !== 'DRAFT' ? (
                      <Button variant="outline" onClick={() => void withdraw(item)}>
                        {t('mine.withdraw')}
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => void remove(item)}>
                        {t('mine.delete')}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
