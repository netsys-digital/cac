import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ORG_PUBLISH_KINDS, type OrgPublishKind } from '@cac/shared';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { useStaffTasks } from '../../auth/StaffTasksContext';
import { catalogApi, type RepresentationRequest } from '../../api/catalogApi';
import { resolveMediaUrl } from '../../components/forms/RepresentativeImageField';
import { PublishKindsPicker } from '../../components/forms/PublishKindsPicker';

export function AdminRepresentationPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { refresh } = useStaffTasks();
  const [items, setItems] = useState<RepresentationRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [kindsById, setKindsById] = useState<Record<string, OrgPublishKind[]>>({});

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await catalogApi.adminRepresentations(accessToken);
      setItems(res.items);
      setKindsById((prev) => {
        const next = { ...prev };
        for (const item of res.items) {
          if (!next[item.id]) {
            const existing = (item.organization as { publishKinds?: OrgPublishKind[] } | undefined)
              ?.publishKinds;
            next[item.id] =
              existing && existing.length > 0 ? existing : [...ORG_PUBLISH_KINDS];
          }
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(item: RepresentationRequest) {
    if (!accessToken) return;
    const publishKinds = kindsById[item.id] ?? [];
    if (!publishKinds.length) {
      setError(t('admin.publishKindsRequired'));
      return;
    }
    setBusyId(item.id);
    setMessage('');
    setError('');
    try {
      await catalogApi.approveRepresentation(accessToken, item.id, { publishKinds });
      setMessage(t('admin.repApproved'));
      await load();
      await refresh();
    } catch {
      setMessage('');
      setError(t('admin.repError'));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!accessToken) return;
    setBusyId(id);
    setMessage('');
    setError('');
    try {
      await catalogApi.rejectRepresentation(accessToken, id);
      setMessage(t('admin.repRejected'));
      await load();
      await refresh();
    } catch {
      setError(t('admin.repError'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
        <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
          {t('curator.queueRep')}
        </p>
        <h1 className="mt-1 text-grande font-bold text-cac-navy">{t('admin.repTitle')}</h1>
        <p className="mt-2 max-w-3xl text-media text-cac-muted">{t('admin.repSupport')}</p>
        <p className="mt-4 inline-flex rounded-full border border-cac-line bg-[#fbfcfb] px-3 py-1.5 text-pequena font-bold text-cac-navy">
          {t('admin.pendingTotal', { count: items.length })}
        </p>
      </header>

      {message ? (
        <p className="rounded-xl border border-cac-line bg-cac-green3/40 px-4 py-3 text-media font-semibold text-cac-navy">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-media font-semibold text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-media text-cac-muted">{t('dash.loading')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const doc1 = resolveMediaUrl(item.proofDocument1Url);
            const doc2 = resolveMediaUrl(item.proofDocument2Url);
            return (
              <li key={item.id} className="rounded-2xl border border-cac-line bg-white p-4 shadow-cac">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-media font-bold text-cac-navy">
                      {item.user?.name ?? '—'} · {item.organization?.name ?? '—'}
                    </p>
                    <p className="text-media text-cac-muted">
                      {item.unit} · {item.linkRole}
                      {item.user?.email ? ` · ${item.user.email}` : ''}
                    </p>
                  </div>
                  <span className="mt-2 inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-1 text-mini font-bold uppercase tracking-wide text-amber-900 sm:mt-0">
                    {t('admin.repStatusRequested')}
                  </span>
                </div>
                {item.interest ? (
                  <p className="mt-3 rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-2 text-media text-cac-navy">
                    {item.interest}
                  </p>
                ) : null}
                <div className="mt-3 rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-2">
                  <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                    {t('admin.repDocs')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {doc1 ? (
                      <a
                        href={doc1}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-[10px] border border-cac-line bg-white px-3 py-1.5 text-pequena font-bold text-cac-navy transition hover:bg-cac-green3"
                      >
                        {t('admin.repDoc1')}
                      </a>
                    ) : (
                      <span className="text-pequena text-cac-muted">
                        {t('admin.repDoc1')}: {t('admin.repDocMissing')}
                      </span>
                    )}
                    {doc2 ? (
                      <a
                        href={doc2}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-[10px] border border-cac-line bg-white px-3 py-1.5 text-pequena font-bold text-cac-navy transition hover:bg-cac-green3"
                      >
                        {t('admin.repDoc2')}
                      </a>
                    ) : (
                      <span className="text-pequena text-cac-muted">
                        {t('admin.repDoc2')}: {t('admin.repDocMissing')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <PublishKindsPicker
                    idPrefix={`rep-${item.id}`}
                    value={kindsById[item.id] ?? []}
                    onChange={(next) => setKindsById((prev) => ({ ...prev, [item.id]: next }))}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    disabled={busyId === item.id || !(kindsById[item.id]?.length)}
                    onClick={() => void approve(item)}
                  >
                    {busyId === item.id ? t('admin.working') : t('admin.approve')}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busyId === item.id}
                    onClick={() => void reject(item.id)}
                  >
                    {t('admin.reject')}
                  </Button>
                </div>
              </li>
            );
          })}
          {!items.length ? (
            <li className="rounded-2xl border border-dashed border-cac-line bg-white px-4 py-8 text-center text-media text-cac-muted">
              {t('admin.empty')}
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
