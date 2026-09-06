import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type RepresentationRequest } from '../../api/catalogApi';

export function AdminRepresentationPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [items, setItems] = useState<RepresentationRequest[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    if (!accessToken) return;
    const res = await catalogApi.adminRepresentations(accessToken);
    setItems(res.items);
  }

  useEffect(() => {
    void load();
  }, [accessToken]);

  async function approve(item: RepresentationRequest) {
    if (!accessToken) return;
    await catalogApi.approveRepresentation(accessToken, item.id);
    await catalogApi.verifyOrganization(accessToken, item.organizationId);
    setMessage(t('admin.repApproved'));
    await load();
  }

  async function reject(id: string) {
    if (!accessToken) return;
    await catalogApi.rejectRepresentation(accessToken, id);
    setMessage(t('admin.repRejected'));
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-cac-ink">{t('admin.repTitle')}</h1>
      {message ? <p className="text-sm text-cac-forest">{message}</p> : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-cac-line bg-white/80 p-4">
            <p className="font-semibold text-cac-ink">
              {item.user?.name} · {item.organization?.name}
            </p>
            <p className="text-sm text-cac-muted">
              {item.unit} · {item.linkRole}
            </p>
            <p className="mt-2 text-sm">{item.interest}</p>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => void approve(item)}>{t('admin.approve')}</Button>
              <Button variant="secondary" onClick={() => void reject(item.id)}>
                {t('admin.reject')}
              </Button>
            </div>
          </li>
        ))}
        {items.length === 0 ? <li className="text-sm text-cac-muted">{t('admin.empty')}</li> : null}
      </ul>
    </div>
  );
}
