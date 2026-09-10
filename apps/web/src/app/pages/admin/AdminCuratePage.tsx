import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { formatDateTime } from '@cac/shared';
import { useAuth } from '../../auth/AuthContext';
import { useStaffTasks } from '../../auth/StaffTasksContext';
import { connectionsApi, type PendingItem } from '../../api/connectionsApi';
import { Modal } from '../../components/Modal';
import { useModalState } from '../../components/useModalState';

type Decision = 'approve' | 'return' | 'reject';

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
  const modal = useModalState<PendingItem>();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const pending = await connectionsApi.adminPending(accessToken);
      setItems(pending.items);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

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

  const item = modal.item;
  const isView = modal.mode === 'view';

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
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-cac-line bg-[#fbfcfb] px-3 py-1.5 text-pequena font-bold text-cac-navy">
            {t('admin.pendingTotal', { count: items.length })}
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
                    {kindLabel(row.kind, t)} · {t('admin.submittedForReview')}
                  </p>
                  <p className="mt-1 text-media font-bold text-cac-navy">{row.title}</p>
                  <p className="text-media text-cac-muted">
                    {row.organization?.name ?? '—'}
                    {row.country ? ` · ${row.country}` : ''}
                    {row.region ? ` · ${row.region}` : ''} ·{' '}
                    {formatDateTime(row.updatedAt, i18n.language)}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-mini font-bold uppercase tracking-wide text-amber-900">
                    {t('mine.status.IN_REVIEW')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => modal.openView(row)}>
                    {t('common.view')}
                  </Button>
                  <Button type="button" onClick={() => modal.openEdit(row)}>
                    {t('admin.openDecision')}
                  </Button>
                </div>
              </li>
            );
          })}
          {!items.length ? (
            <li className="rounded-2xl border border-dashed border-cac-line bg-white px-4 py-8 text-center text-media text-cac-muted">
              {t('admin.curateEmpty')}
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
          isView ? (
            <>
              <Button type="button" variant="secondary" onClick={modal.close}>
                {t('common.close')}
              </Button>
              <Button type="button" onClick={() => modal.setMode('edit')}>
                {t('admin.openDecision')}
              </Button>
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
    </div>
  );
}
