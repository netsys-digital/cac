import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, useDialog } from '@cac/ui';
import { formatDateTime } from '@cac/shared';
import { useAuth } from '../../auth/AuthContext';
import { useStaffTasks } from '../../auth/StaffTasksContext';
import {
  connectionsApi,
  type DeletionRequestItem,
  type PendingItem,
} from '../../api/connectionsApi';
import { Modal } from '../../components/Modal';
import { useModalState } from '../../components/useModalState';

type Decision = 'approve' | 'return' | 'reject';
type StatusFilter = 'IN_REVIEW' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'ALL';

const STATUS_FILTERS: StatusFilter[] = ['IN_REVIEW', 'PUBLISHED', 'DRAFT', 'ARCHIVED', 'ALL'];

function statusClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-cac-green3 text-cac-navy';
  if (status === 'IN_REVIEW') return 'bg-amber-100 text-amber-900';
  if (status === 'ARCHIVED') return 'bg-red-100 text-red-900';
  return 'bg-[#edf1f3] text-cac-muted';
}

function kindLabel(kind: string, t: (key: string) => string) {
  const map: Record<string, string> = {
    TECHNOLOGY: t('curator.kindTech'),
    CHALLENGE: t('curator.kindChallenge'),
    PROJECT: t('curator.kindProject'),
    FUNDING_OFFER: t('curator.kindOffer'),
    SUCCESS_CASE: t('curator.kindCase'),
  };
  return map[kind] ?? kind;
}

export function AdminCuratePage() {
  const { t, i18n } = useTranslation();
  const { accessToken } = useAuth();
  const { refresh } = useStaffTasks();
  const dialog = useDialog();
  const modal = useModalState<PendingItem>();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('IN_REVIEW');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequestItem[]>([]);
  const [deletionItem, setDeletionItem] = useState<DeletionRequestItem | null>(null);
  const [deletionNote, setDeletionNote] = useState('');
  const [deletionError, setDeletionError] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [pending, deletions] = await Promise.all([
        connectionsApi.adminPending(accessToken, statusFilter),
        connectionsApi.adminDeletionRequests(accessToken),
      ]);
      setItems(pending.items);
      setDeletionRequests(deletions.items);
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter]);

  function openDeletionDecision(row: DeletionRequestItem) {
    setDeletionItem(row);
    setDeletionNote('');
    setDeletionError('');
  }

  async function decideDeletion(decision: 'approve' | 'reject') {
    if (!accessToken || !deletionItem) return;
    const trimmed = deletionNote.trim();
    if (decision === 'reject' && !trimmed) {
      setDeletionError(t('admin.noteRequired'));
      return;
    }
    setBusy(true);
    setMessage('');
    setDeletionError('');
    try {
      if (decision === 'approve') {
        await connectionsApi.approveDeletionRequest(accessToken, deletionItem.id, trimmed || undefined);
        setMessage(t('admin.deletionApproved'));
      } else {
        await connectionsApi.rejectDeletionRequest(accessToken, deletionItem.id, trimmed);
        setMessage(t('admin.deletionRejected'));
      }
      setDeletionItem(null);
      await load();
      await refresh();
    } catch {
      setDeletionError(t('admin.decisionError'));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (modal.open) setNote('');
  }, [modal.open, modal.item]);

  const byKind = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.kind] = (counts[item.kind] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  async function decide(decision: Decision) {
    if (!accessToken || !modal.item) return;
    const trimmed = note.trim();
    if ((decision === 'return' || decision === 'reject') && !trimmed) {
      setError(t('admin.noteRequired'));
      return;
    }

    setBusy(true);
    setMessage('');
    setError('');
    try {
      if (decision === 'approve') {
        await connectionsApi.publishPending(
          accessToken,
          modal.item.kind,
          modal.item.id,
          trimmed || undefined,
        );
        setMessage(t('admin.published'));
      } else if (decision === 'return') {
        await connectionsApi.returnPending(accessToken, modal.item.kind, modal.item.id, trimmed);
        setMessage(t('admin.returned'));
      } else {
        await connectionsApi.rejectPending(accessToken, modal.item.kind, modal.item.id, trimmed);
        setMessage(t('admin.contentRejected'));
      }
      modal.close();
      await load();
      await refresh();
    } catch {
      setError(t('admin.decisionError'));
    } finally {
      setBusy(false);
    }
  }

  async function removeContent(row: PendingItem) {
    if (!accessToken) return;
    const ok = await dialog.confirm({
      title: t('admin.contentDeleteTitle'),
      message: t('admin.contentDeleteConfirm', {
        title: row.title,
        org: row.organization?.name ?? '—',
      }),
      confirmLabel: t('admin.delete'),
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await connectionsApi.adminDeleteContent(accessToken, row.kind, row.id);
      setMessage(t('admin.contentDeleted'));
      if (modal.item?.id === row.id) modal.close();
      await load();
      await refresh();
    } catch {
      setError(t('admin.contentDeleteError'));
    } finally {
      setBusy(false);
    }
  }

  const item = modal.item;
  const isView = modal.mode === 'view';
  const canDecide = item?.status === 'IN_REVIEW';

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
        <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
          {t('curator.queueContent')}
        </p>
        <h1 className="mt-1 text-grande font-bold text-cac-navy">{t('admin.curateTitle')}</h1>
        <p className="mt-2 max-w-3xl text-media text-cac-muted">{t('admin.curateSupport')}</p>
        <ul className="mt-3 grid gap-2 text-media text-cac-navy sm:grid-cols-3">
          <li className="rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-2">
            <span className="font-bold text-cac-green">{t('admin.decisionApprove')}: </span>
            {t('admin.decisionApproveHint')}
          </li>
          <li className="rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-2">
            <span className="font-bold text-amber-800">{t('admin.decisionReturn')}: </span>
            {t('admin.decisionReturnHint')}
          </li>
          <li className="rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-2">
            <span className="font-bold text-red-800">{t('admin.decisionReject')}: </span>
            {t('admin.decisionRejectHint')}
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-pequena font-bold">
          <span className="text-mini font-extrabold tracking-[1.2px] text-cac-muted uppercase">
            {t('admin.curateStatusFilter')}
          </span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 transition ${
                statusFilter === s ? 'ring-2 ring-cac-navy/30 ' : ''
              } ${s === 'ALL' ? 'border border-cac-line bg-white text-cac-navy' : statusClass(s)}`}
            >
              {t(`mine.status.${s}`)}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-cac-line bg-[#fbfcfb] px-3 py-1.5 text-pequena font-bold text-cac-navy">
            {statusFilter === 'IN_REVIEW'
              ? t('admin.pendingTotal', { count: items.length })
              : `${t(`mine.status.${statusFilter}`)} · ${items.length}`}
          </span>
          {Object.entries(byKind).map(([kind, count]) => (
            <span
              key={kind}
              className="rounded-full border border-cac-line bg-white px-3 py-1.5 text-pequena font-semibold text-cac-muted"
            >
              {kindLabel(kind, t)} · {count}
            </span>
          ))}
        </div>
      </header>

      {message ? (
        <p className="rounded-xl border border-cac-line bg-cac-green3/40 px-4 py-3 text-media font-semibold text-cac-navy">
          {message}
        </p>
      ) : null}
      {error && !modal.open ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-media font-semibold text-red-900">
          {error}
        </p>
      ) : null}

      {!loading && deletionRequests.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-red-200 bg-white p-4 shadow-cac">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-pequena font-extrabold tracking-[0.12em] text-red-800 uppercase">
                {t('admin.deletionQueue')}
              </p>
              <p className="mt-1 text-media text-cac-muted">{t('admin.deletionQueueHint')}</p>
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1.5 text-pequena font-bold text-red-900">
              {deletionRequests.length}
            </span>
          </div>
          <ul className="space-y-2">
            {deletionRequests.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-3 rounded-xl border border-cac-line bg-[#fbfcfb] p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-pequena font-bold uppercase tracking-wide text-cac-green">
                    {kindLabel(row.kind, t)}
                    {row.contentStatus ? ` · ${t(`mine.status.${row.contentStatus}`)}` : ''}
                  </p>
                  <p className="mt-1 text-media font-bold text-cac-navy">{row.targetTitle}</p>
                  <p className="text-pequena text-cac-muted">
                    {row.organization.name} · {t('admin.deletionRequestedBy', { name: row.requester.name })} ·{' '}
                    {formatDateTime(row.createdAt, i18n.language)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-pequena leading-snug text-cac-navy">
                    <span className="font-bold">{t('admin.deletionReason')}: </span>
                    {row.reason}
                  </p>
                </div>
                <Button type="button" disabled={busy} onClick={() => openDeletionDecision(row)}>
                  {t('admin.openDecision')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {loading ? (
        <p className="text-media text-cac-muted">{t('dash.loading')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((row) => {
            const key = `${row.kind}-${row.id}`;
            return (
              <li
                key={key}
                className="flex flex-col gap-3 rounded-2xl border border-cac-line bg-white p-4 shadow-cac sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-pequena font-bold uppercase tracking-wide text-cac-green">
                    {kindLabel(row.kind, t)}
                    {row.status === 'IN_REVIEW' ? ` · ${t('admin.submittedForReview')}` : ''}
                  </p>
                  <p className="mt-1 text-media font-bold text-cac-navy">{row.title}</p>
                  <p className="text-media text-cac-muted">
                    {row.organization?.name ?? '—'}
                    {row.country ? ` · ${row.country}` : ''}
                    {row.region ? ` · ${row.region}` : ''} ·{' '}
                    {formatDateTime(row.updatedAt, i18n.language)}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-mini font-bold uppercase tracking-wide ${statusClass(row.status ?? 'IN_REVIEW')}`}
                  >
                    {t(`mine.status.${row.status ?? 'IN_REVIEW'}`)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => modal.openView(row)}>
                    {t('common.view')}
                  </Button>
                  {row.status === 'IN_REVIEW' ? (
                    <Button type="button" onClick={() => modal.openEdit(row)}>
                      {t('admin.openDecision')}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void removeContent(row)}
                  >
                    {t('admin.delete')}
                  </Button>
                </div>
              </li>
            );
          })}
          {!items.length ? (
            <li className="rounded-2xl border border-dashed border-cac-line bg-white px-4 py-8 text-center text-media text-cac-muted">
              {statusFilter === 'IN_REVIEW' ? t('admin.curateEmpty') : t('admin.curateEmptyFiltered')}
            </li>
          ) : null}
        </ul>
      )}

      <Modal
        open={modal.open}
        onClose={modal.close}
        mode={isView ? 'view' : 'edit'}
        badge={t('curator.queueContent')}
        title={item?.title ?? t('admin.curateTitle')}
        description={
          item
            ? `${kindLabel(item.kind, t)} · ${item.organization?.name ?? '—'} · ${formatDateTime(item.updatedAt, i18n.language)}`
            : undefined
        }
        size="lg"
        dismissible={!busy}
        footer={
          isView || !canDecide ? (
            <>
              <Button type="button" variant="secondary" onClick={modal.close}>
                {t('common.close')}
              </Button>
              {item ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void removeContent(item)}
                >
                  {t('admin.delete')}
                </Button>
              ) : null}
              {canDecide ? (
                <Button type="button" onClick={() => modal.setMode('edit')}>
                  {t('admin.openDecision')}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" disabled={busy} onClick={modal.close}>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void decide('reject')}
              >
                {t('admin.decisionReject')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void decide('return')}
              >
                {t('admin.decisionReturn')}
              </Button>
              <Button type="button" disabled={busy} onClick={() => void decide('approve')}>
                {busy ? t('common.working') : t('admin.decisionApprove')}
              </Button>
            </>
          )
        }
      >
        {error && modal.open ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-800">
            {error}
          </p>
        ) : null}

        {item ? (
          <div className="space-y-4">
            {item.summary ? (
              <p className="rounded-xl border border-cac-line bg-white px-3 py-2 text-media leading-relaxed text-cac-navy/90">
                {item.summary}
              </p>
            ) : null}
            {item.curationNote ? (
              <p className="rounded-xl border border-cac-line bg-white px-3 py-2 text-pequena text-cac-muted">
                <span className="font-bold text-cac-navy">{t('admin.previousNote')}: </span>
                {item.curationNote}
              </p>
            ) : null}

            {!isView ? (
              <label className="block">
                <span className="text-pequena font-bold tracking-wide text-cac-navy uppercase">
                  {t('admin.noteLabel')}
                </span>
                <textarea
                  className="mt-1.5 min-h-[96px] w-full rounded-xl border border-cac-line bg-white px-3 py-2 text-media text-cac-navy outline-none ring-cac-green focus:ring-2"
                  placeholder={t('admin.notePlaceholder')}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={busy}
                />
                <span className="mt-1 block text-pequena text-cac-muted">{t('admin.noteHint')}</span>
              </label>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deletionItem)}
        onClose={() => setDeletionItem(null)}
        mode="edit"
        badge={t('admin.deletionQueue')}
        title={deletionItem?.targetTitle ?? t('admin.deletionQueue')}
        description={
          deletionItem
            ? `${kindLabel(deletionItem.kind, t)} · ${deletionItem.organization.name} · ${formatDateTime(deletionItem.createdAt, i18n.language)}`
            : undefined
        }
        size="lg"
        dismissible={!busy}
        footer={
          <>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setDeletionItem(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void decideDeletion('reject')}
            >
              {t('admin.deletionKeep')}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void decideDeletion('approve')}>
              {busy ? t('common.working') : t('admin.deletionApprove')}
            </Button>
          </>
        }
      >
        {deletionError ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-800">
            {deletionError}
          </p>
        ) : null}
        {deletionItem ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-pequena font-bold tracking-wide text-amber-900 uppercase">
                {t('admin.deletionReason')}
              </p>
              <p className="mt-1 whitespace-pre-line text-media leading-relaxed text-cac-navy">
                {deletionItem.reason}
              </p>
              <p className="mt-2 text-pequena text-cac-muted">
                {t('admin.deletionRequestedBy', { name: deletionItem.requester.name })} ({deletionItem.requester.email})
              </p>
            </div>
            {deletionItem.contentStatus ? (
              <p className="text-pequena text-cac-muted">
                {t('admin.deletionContentStatus')}:{' '}
                <span
                  className={`rounded-full px-2 py-0.5 font-bold ${statusClass(deletionItem.contentStatus)}`}
                >
                  {t(`mine.status.${deletionItem.contentStatus}`)}
                </span>
              </p>
            ) : (
              <p className="text-pequena text-cac-muted">{t('admin.deletionContentMissing')}</p>
            )}
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-900">
              {t('admin.deletionWarning')}
            </p>
            <label className="block">
              <span className="text-pequena font-bold tracking-wide text-cac-navy uppercase">
                {t('admin.noteLabel')}
              </span>
              <textarea
                className="mt-1.5 min-h-[96px] w-full rounded-xl border border-cac-line bg-white px-3 py-2 text-media text-cac-navy outline-none ring-cac-green focus:ring-2"
                placeholder={t('admin.deletionNotePlaceholder')}
                value={deletionNote}
                onChange={(e) => setDeletionNote(e.target.value)}
                disabled={busy}
              />
              <span className="mt-1 block text-pequena text-cac-muted">{t('admin.deletionNoteHint')}</span>
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
