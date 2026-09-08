import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { connectionsApi, type Connection } from '../../api/connectionsApi';

export function MyConnectionsPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [items, setItems] = useState<Connection[]>([]);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    const res = await connectionsApi.list(accessToken);
    setItems(res.items);
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(id: string) {
    if (!accessToken) return;
    await connectionsApi.accept(accessToken, id);
    setMessage(t('conn.accepted'));
    await load();
  }

  async function decline(id: string) {
    if (!accessToken) return;
    await connectionsApi.decline(accessToken, id);
    setMessage(t('conn.declined'));
    await load();
  }

  async function close(id: string) {
    if (!accessToken) return;
    await connectionsApi.close(accessToken, id);
    setMessage(t('conn.closed'));
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-black text-cac-navy">{t('conn.listTitle')}</h1>
      {message ? <p className="text-[11px] text-cac-green">{message}</p> : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-cac-line bg-white p-4">
            <p className="text-[12px] font-black text-cac-navy">
              {item.requesterOrg?.name} → {item.targetOrg?.name}
            </p>
            <p className="mt-1 text-[10px] text-cac-muted">
              {item.targetType} · {item.objective} · <b>{item.status}</b>
            </p>
            {item.message ? <p className="mt-2 text-[11px] text-cac-ink">{item.message}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {item.status === 'PENDING' ? (
                <>
                  <Button onClick={() => void accept(item.id)}>{t('conn.accept')}</Button>
                  <Button variant="secondary" onClick={() => void decline(item.id)}>
                    {t('conn.decline')}
                  </Button>
                </>
              ) : null}
              {item.status === 'ACCEPTED' || item.status === 'CONTACT_SHARED' ? (
                <Button variant="secondary" onClick={() => void close(item.id)}>
                  {t('conn.close')}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
        {!items.length ? <li className="text-[11px] text-cac-muted">{t('conn.empty')}</li> : null}
      </ul>
    </div>
  );
}
