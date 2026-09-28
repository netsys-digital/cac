import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, useDialog } from '@cac/ui';
import { formatDateTime } from '@cac/shared';
import { useAuth } from '../../auth/AuthContext';
import { useRepresentation } from '../../auth/RepresentationContext';
import {
  myContentsApi,
  type ContentKind,
  type ContentMetrics,
  type MyContentItem,
} from '../../api/myContentsApi';
import { Modal } from '../../components/Modal';

const DELETION_REASON_MIN = 10;

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

type ActionTone = 'default' | 'green' | 'danger';

const actionToneClass: Record<ActionTone, string> = {
  default: 'text-cac-navy hover:border-cac-navy/40 hover:bg-[#f7faf8]',
  green: 'text-cac-green hover:border-cac-green/50 hover:bg-cac-green3/40',
  danger: 'text-red-700 hover:border-red-300 hover:bg-red-50',
};

const actionBaseClass =
  'inline-flex size-10 items-center justify-center rounded-full border border-cac-line bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cac-green disabled:opacity-50';

function IconAction({
  label,
  tone = 'default',
  onClick,
  children,
}: {
  label: string;
  tone?: ActionTone;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`${actionBaseClass} ${actionToneClass[tone]}`}
    >
      {children}
    </button>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16v4Z" strokeLinejoin="round" />
      <path d="m13.5 6.5 4 4" strokeLinecap="round" />
    </svg>
  );
}

function IconReopen() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.1 14.5A7.5 7.5 0 1 0 6.3 7L4 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v5.5M14 11v5.5" strokeLinecap="round" />
    </svg>
  );
}

function IconTrashRequest() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3.5 7h11M7 7V4.5h4.5V7M5.5 7l.9 12.5h5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17.5" cy="16.5" r="4" />
      <path d="M17.5 14.5v2l1.3 1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCancelRequest() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9 9 6 6M15 9l-6 6" strokeLinecap="round" />
    </svg>
  );
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
  const { isStaff } = useRepresentation();
  const dialog = useDialog();
  const [items, setItems] = useState<MyContentItem[]>([]);
  const [deletionTarget, setDeletionTarget] = useState<MyContentItem | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionError, setDeletionError] = useState('');
  const [deletionBusy, setDeletionBusy] = useState(false);
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

  function openDeletionRequest(item: MyContentItem) {
    setDeletionTarget(item);
    setDeletionReason('');
    setDeletionError('');
  }

  async function submitDeletionRequest() {
    if (!accessToken || !deletionTarget) return;
    const reason = deletionReason.trim();
    if (reason.length < DELETION_REASON_MIN) {
      setDeletionError(t('mine.deletionReasonTooShort', { min: DELETION_REASON_MIN }));
      return;
    }
    setDeletionBusy(true);
    setDeletionError('');
    try {
      await myContentsApi.requestDeletion(accessToken, deletionTarget.kind, deletionTarget.id, reason);
      setDeletionTarget(null);
      setMessage(t('mine.deletionRequested'));
      await load();
    } catch (e) {
      setDeletionError(
        e instanceof Error && e.message.includes('deletion_already_requested')
          ? t('mine.deletionAlreadyRequested')
          : t('mine.deletionRequestError'),
      );
    } finally {
      setDeletionBusy(false);
    }
  }

  async function cancelDeletionRequest(item: MyContentItem) {
    if (!accessToken) return;
    const ok = await dialog.confirm({
      title: t('mine.deletionCancel'),
      message: t('mine.deletionCancelConfirm'),
      confirmLabel: t('mine.deletionCancel'),
    });
    if (!ok) return;
    setMessage('');
    try {
      await myContentsApi.cancelDeletionRequest(accessToken, item.kind, item.id);
      setMessage(t('mine.deletionCancelled'));
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
                    {item.deletionRequest?.status === 'REQUESTED' ? (
                      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-pequena leading-snug text-amber-900">
                        <span className="font-bold">
                          {t('mine.deletionPendingLabel', {
                            name: item.deletionRequest.requesterName,
                            date: formatDateTime(item.deletionRequest.createdAt, i18n.language),
                          })}
                          :{' '}
                        </span>
                        {item.deletionRequest.reason}
                      </p>
                    ) : item.deletionRequest?.status === 'REJECTED' ? (
                      <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-pequena leading-snug text-red-900">
                        <span className="font-bold">{t('mine.deletionRejectedLabel')}: </span>
                        {item.deletionRequest.reviewNote}
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

                  <div className="flex flex-nowrap gap-2 md:justify-end">
                    <Link
                      to={item.editPath}
                      title={t('mine.edit')}
                      aria-label={t('mine.edit')}
                      className={`${actionBaseClass} ${actionToneClass.default}`}
                    >
                      <IconEdit />
                    </Link>
                    {item.status !== 'DRAFT' ? (
                      <IconAction label={t('mine.withdraw')} tone="green" onClick={() => void withdraw(item)}>
                        <IconReopen />
                      </IconAction>
                    ) : (
                      <IconAction label={t('mine.delete')} tone="danger" onClick={() => void remove(item)}>
                        <IconTrash />
                      </IconAction>
                    )}
                    {!isStaff && item.status !== 'DRAFT' ? (
                      item.deletionRequest?.status === 'REQUESTED' ? (
                        item.deletionRequest.isMine ? (
                          <IconAction
                            label={t('mine.deletionCancel')}
                            onClick={() => void cancelDeletionRequest(item)}
                          >
                            <IconCancelRequest />
                          </IconAction>
                        ) : null
                      ) : (
                        <IconAction
                          label={t('mine.deletionRequest')}
                          tone="danger"
                          onClick={() => openDeletionRequest(item)}
                        >
                          <IconTrashRequest />
                        </IconAction>
                      )
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal
        open={Boolean(deletionTarget)}
        onClose={() => setDeletionTarget(null)}
        mode="edit"
        badge={t('mine.deletionBadge')}
        title={t('mine.deletionTitle')}
        description={
          deletionTarget
            ? `${t(`mine.kind.${deletionTarget.kind}`)} · ${deletionTarget.title} · ${deletionTarget.organizationName}`
            : undefined
        }
        size="md"
        dismissible={!deletionBusy}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={deletionBusy}
              onClick={() => setDeletionTarget(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="button" disabled={deletionBusy} onClick={() => void submitDeletionRequest()}>
              {deletionBusy ? t('common.working') : t('mine.deletionSubmit')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-media leading-relaxed text-cac-muted">{t('mine.deletionIntro')}</p>
          {deletionError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-800">
              {deletionError}
            </p>
          ) : null}
          <label className="block">
            <span className="text-pequena font-bold tracking-wide text-cac-navy uppercase">
              {t('mine.deletionReasonLabel')}
            </span>
            <textarea
              className="mt-1.5 min-h-[120px] w-full rounded-xl border border-cac-line bg-white px-3 py-2 text-media text-cac-navy outline-none ring-cac-green focus:ring-2"
              placeholder={t('mine.deletionReasonPlaceholder')}
              value={deletionReason}
              maxLength={2000}
              onChange={(e) => setDeletionReason(e.target.value)}
              disabled={deletionBusy}
            />
            <span className="mt-1 block text-pequena text-cac-muted">
              {t('mine.deletionReasonHint', { min: DELETION_REASON_MIN })}
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
