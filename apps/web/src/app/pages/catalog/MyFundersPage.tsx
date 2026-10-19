import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { fundingWizardApi, type MyFunder } from '../../api/fundingWizardApi';

export function MyFundersPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [items, setItems] = useState<MyFunder[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    const res = await fundingWizardApi.myFunders(accessToken);
    setItems(res.items);
  }, [accessToken]);

  useEffect(() => {
    void load().catch(() => setError(t('catalog.funderError')));
  }, [load, t]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
        <div>
          <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
            {t('admin.fundersEyebrow')}
          </p>
          <h1 className="mt-1 text-grande font-bold text-cac-navy">{t('catalog.myFunders')}</h1>
          <p className="mt-2 max-w-2xl text-pequena leading-relaxed text-cac-muted">{t('catalog.myFundersHint')}</p>
        </div>
        <Link to="/funders/new">
          <Button type="button">{t('catalog.newFunder')}</Button>
        </Link>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-media font-semibold text-red-800">{error}</p>
      ) : null}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cac-line bg-white px-4 py-3 shadow-cac"
          >
            <div className="min-w-0">
              <p className="text-media font-bold text-cac-navy">{item.name}</p>
              <p className="mt-1 text-mini text-cac-muted">{t(`mine.status.${item.status}`, { defaultValue: item.status })}</p>
              {item.curationNote ? (
                <p className="mt-2 text-pequena text-cac-navy">{item.curationNote}</p>
              ) : null}
            </div>
            {item.status === 'DRAFT' ? (
              <Link to={`/funders/${item.id}/edit`}>
                <Button type="button">{t('common.edit')}</Button>
              </Link>
            ) : null}
          </li>
        ))}
        {!items.length ? (
          <li className="rounded-2xl border border-dashed border-cac-line bg-white px-4 py-8 text-center text-media text-cac-muted">
            {t('catalog.myFundersEmpty')}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
