import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { useStaffTasks } from '../../auth/StaffTasksContext';
import { connectionsApi, type PendingItem } from '../../api/connectionsApi';

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

function formatDate(value: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AdminCuratePage() {
  const { t, i18n } = useTranslation();
  const { accessToken } = useAuth();
  const { refresh } = useStaffTasks();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const pending = await connectionsApi.adminPending(accessToken);
      setItems(pending.items);
      setExpanded((prev) => {
        if (prev || !pending.items.length) return prev;
        const first = pending.items[0];
        return `${first.kind}-${first.id}`;
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const byKind = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.kind] = (counts[item.kind] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  async function decide(item: PendingItem, decision: Decision) {
    if (!accessToken) return;
    const key = `${item.kind}-${item.id}`;
    const note = (notes[key] ?? '').trim();
    if ((decision === 'return' || decision === 'reject') && !note) {
      setError(t('admin.noteRequired'));
      setExpanded(key);
      return;
    }

    setBusyId(key);
    setMessage('');
    setError('');
    try {
      if (decision === 'approve') {
        await connectionsApi.publishPending(accessToken, item.kind, item.id, note || undefined);
        setMessage(t('admin.published'));
      } else if (decision === 'return') {
        await connectionsApi.returnPending(accessToken, item.kind, item.id, note);
        setMessage(t('admin.returned'));
      } else {
        await connectionsApi.rejectPending(accessToken, item.kind, item.id, note);
        setMessage(t('admin.contentRejected'));
      }
      setNotes((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await load();
      await refresh();
    } catch {
      setError(t('admin.decisionError'));
    } finally {
      setBusyId(null);
    }
  }

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
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-media font-semibold text-red-900">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-media text-cac-muted">{t('dash.loading')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const key = `${item.kind}-${item.id}`;
            const isOpen = expanded === key;
            const noteValue = notes[key] ?? '';
            return (
              <li key={key} className="rounded-2xl border border-cac-line bg-white p-4 shadow-cac">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : key)}
                >
                  <div className="min-w-0">
                    <p className="text-pequena font-bold uppercase tracking-wide text-cac-green">
                      {kindLabel(item.kind, t)} · {t('admin.submittedForReview')}
                    </p>
                    <p className="mt-1 text-media font-bold text-cac-navy">{item.title}</p>
                    <p className="text-media text-cac-muted">
                      {item.organization?.name ?? '—'}
                      {item.country ? ` · ${item.country}` : ''}
                      {item.region ? ` · ${item.region}` : ''} ·{' '}
                      {formatDate(item.updatedAt, i18n.language)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-mini font-bold uppercase tracking-wide text-amber-900">
                    IN_REVIEW
                  </span>
                </button>

                {item.summary ? (
                  <p className="mt-3 text-media leading-relaxed text-cac-navy/90">{item.summary}</p>
                ) : null}

                {item.curationNote ? (
                  <p className="mt-3 rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-2 text-pequena text-cac-muted">
                    <span className="font-bold text-cac-navy">{t('admin.previousNote')}: </span>
                    {item.curationNote}
                  </p>
                ) : null}

                {isOpen ? (
                  <div className="mt-4 space-y-3 border-t border-cac-line pt-4">
                    <label className="block">
                      <span className="text-pequena font-bold tracking-wide text-cac-navy uppercase">
                        {t('admin.noteLabel')}
                      </span>
                      <textarea
                        className="mt-1.5 min-h-[96px] w-full rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-2 text-media text-cac-navy outline-none ring-cac-green focus:ring-2"
                        placeholder={t('admin.notePlaceholder')}
                        value={noteValue}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                      />
                      <span className="mt-1 block text-pequena text-cac-muted">{t('admin.noteHint')}</span>
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={busyId === key}
                        onClick={() => void decide(item, 'approve')}
                      >
                        {busyId === key ? t('admin.working') : t('admin.decisionApprove')}
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={busyId === key}
                        onClick={() => void decide(item, 'return')}
                      >
                        {t('admin.decisionReturn')}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busyId === key}
                        onClick={() => void decide(item, 'reject')}
                      >
                        {t('admin.decisionReject')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="mt-3 text-media font-bold text-cac-green hover:underline"
                    onClick={() => setExpanded(key)}
                  >
                    {t('admin.openDecision')}
                  </button>
                )}
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
    </div>
  );
}
