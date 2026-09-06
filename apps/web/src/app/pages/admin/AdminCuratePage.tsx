import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { connectionsApi, type PendingItem } from '../../api/connectionsApi';

export function AdminCuratePage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    if (!accessToken) return;
    const [pending, kpiRes] = await Promise.all([
      connectionsApi.adminPending(accessToken),
      connectionsApi.kpis(accessToken),
    ]);
    setItems(pending.items);
    setKpis(kpiRes.kpis);
  }

  useEffect(() => {
    void load();
  }, [accessToken]);

  async function publish(item: PendingItem) {
    if (!accessToken) return;
    await connectionsApi.publishPending(accessToken, item.kind, item.id);
    setMessage(t('admin.published'));
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-black text-cac-navy">{t('admin.curateTitle')}</h1>
        <p className="mt-1 text-[11px] text-cac-muted">{t('admin.curateSupport')}</p>
      </div>

      {kpis ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {Object.entries(kpis).map(([key, value]) => (
            <div key={key} className="rounded-[10px] border border-cac-line bg-white p-3 text-center">
              <b className="block text-[16px] text-cac-navy">{value}</b>
              <span className="text-[10px] text-cac-muted">{key}</span>
            </div>
          ))}
        </div>
      ) : null}

      {message ? <p className="text-[11px] text-cac-green">{message}</p> : null}

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`} className="rounded-xl border border-cac-line bg-white p-4">
            <p className="text-[12px] font-black text-cac-navy">
              {item.kind} · {item.title}
            </p>
            <p className="text-[10px] text-cac-muted">{item.organization?.name}</p>
            <Button className="mt-3" onClick={() => void publish(item)}>
              {t('admin.publish')}
            </Button>
          </li>
        ))}
        {!items.length ? <li className="text-[11px] text-cac-muted">{t('admin.curateEmpty')}</li> : null}
      </ul>
    </div>
  );
}
