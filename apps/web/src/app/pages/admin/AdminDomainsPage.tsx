import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi } from '../../api/catalogApi';

type DomainItem = { id: string; key: string; labelPt: string; labelEn: string; sortOrder: number };

export function AdminDomainsPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [grouping, setGrouping] = useState('region');
  const [items, setItems] = useState<DomainItem[]>([]);
  const [key, setKey] = useState('');
  const [labelPt, setLabelPt] = useState('');
  const [labelEn, setLabelEn] = useState('');

  const load = useCallback(async (g = grouping) => {
    const res = await catalogApi.listDomains(g);
    setItems(res.items);
  }, [grouping]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    await catalogApi.createDomain(accessToken, {
      grouping,
      key,
      labelPt,
      labelEn,
      sortOrder: items.length + 1,
    });
    setKey('');
    setLabelPt('');
    setLabelEn('');
    await load();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-cac-ink">{t('admin.domainsTitle')}</h1>
      <label className="flex max-w-xs flex-col gap-1 text-sm">
        <span className="font-medium">{t('admin.grouping')}</span>
        <select
          className="rounded-md border border-cac-line bg-white px-3 py-2"
          value={grouping}
          onChange={(e) => setGrouping(e.target.value)}
        >
          <option value="region">region</option>
          <option value="country">country</option>
          <option value="need_type">need_type</option>
          <option value="maturity">maturity</option>
        </select>
      </label>

      <form onSubmit={onCreate} className="grid max-w-xl gap-3 rounded-xl border border-cac-line bg-white/80 p-4">
        <Input label="key" value={key} onChange={(e) => setKey(e.target.value)} required />
        <Input label="labelPt" value={labelPt} onChange={(e) => setLabelPt(e.target.value)} required />
        <Input label="labelEn" value={labelEn} onChange={(e) => setLabelEn(e.target.value)} required />
        <Button type="submit">{t('admin.createDomain')}</Button>
      </form>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-md border border-cac-line bg-white/70 px-3 py-2 text-sm"
          >
            <span>
              <strong>{item.key}</strong> — {item.labelPt} / {item.labelEn}
            </span>
            <Button
              variant="ghost"
              onClick={() => accessToken && void catalogApi.deleteDomain(accessToken, item.id).then(() => load())}
            >
              {t('admin.delete')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
