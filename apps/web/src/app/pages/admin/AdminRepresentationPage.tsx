import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { useStaffTasks } from '../../auth/StaffTasksContext';
import { catalogApi, type RepresentationRequest } from '../../api/catalogApi';

export function AdminRepresentationPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { refresh } = useStaffTasks();
  const [items, setItems] = useState<RepresentationRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await catalogApi.adminRepresentations(accessToken);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(item: RepresentationRequest) {
    if (!accessToken) return;
    setBusyId(item.id);
    setMessage('');
    try {
      await catalogApi.approveRepresentation(accessToken, item.id);
      await catalogApi.verifyOrganization(accessToken, item.organizationId);
      setMessage(t('admin.repApproved'));
      await load();
      await refresh();
    } catch {
      setMessage(t('admin.repError'));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!accessToken) return;
    setBusyId(id);
    setMessage('');
    try {
      await catalogApi.rejectRepresentation(accessToken, id);
      setMessage(t('admin.repRejected'));
      await load();
      await refresh();
    } catch {
      setMessage(t('admin.repError'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
        <p className="text-pequena font-black tracking-[0.12em] text-cac-green uppercase">
          {t('curator.queueRep')}
        </p>
        <h1 className="mt-1 text-grande font-black text-cac-navy">{t('admin.repTitle')}</h1>
        <p className="mt-2 max-w-3xl text-media text-cac-muted">{t('admin.repSupport')}</p>
        <p className="mt-4 inline-flex rounded-full border border-cac-line bg-[#fbfcfb] px-3 py-1.5 text-pequena font-black text-cac-navy">
          {t('admin.pendingTotal', { count: items.length })}
        </p>
      </header>

      {message ? (
        <p className="rounded-xl border border-cac-line bg-cac-green3/40 px-4 py-3 text-media font-semibold text-cac-navy">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-media text-cac-muted">{t('dash.loading')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-cac-line bg-white p-4 shadow-cac">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-media font-black text-cac-navy">
                    {item.user?.name ?? '—'} · {item.organization?.name ?? '—'}
                  </p>
                  <p className="text-media text-cac-muted">
                    {item.unit} · {item.linkRole}
                    {item.user?.email ? ` · ${item.user.email}` : ''}
                  </p>
                </div>
                <span className="mt-2 inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-1 text-mini font-black uppercase tracking-wide text-amber-900 sm:mt-0">
                  {t('admin.repStatusRequested')}
                </span>
              </div>
              {item.interest ? (
                <p className="mt-3 rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-2 text-media text-cac-navy">
                  {item.interest}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button disabled={busyId === item.id} onClick={() => void approve(item)}>
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
          ))}
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
