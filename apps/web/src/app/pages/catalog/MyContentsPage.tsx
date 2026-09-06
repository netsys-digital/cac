import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { myContentsApi, type ContentKind, type MyContentItem } from '../../api/myContentsApi';

const KINDS: Array<ContentKind | 'ALL'> = [
  'ALL',
  'TECHNOLOGY',
  'CHALLENGE',
  'FUNDING_OFFER',
  'SUCCESS_CASE',
];

const STATUSES = ['ALL', 'DRAFT', 'IN_REVIEW', 'PUBLISHED'] as const;

function statusClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-cac-green3 text-cac-navy';
  if (status === 'IN_REVIEW') return 'bg-amber-100 text-amber-900';
  return 'bg-[#edf1f3] text-cac-muted';
}

export function MyContentsPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [items, setItems] = useState<MyContentItem[]>([]);
  const [kind, setKind] = useState<(typeof KINDS)[number]>('ALL');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('ALL');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await myContentsApi.list(accessToken, {
        kind: kind === 'ALL' ? undefined : kind,
        status: status === 'ALL' ? undefined : status,
      });
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [accessToken, kind, status]);

  const counts = useMemo(() => {
    const c = { DRAFT: 0, IN_REVIEW: 0, PUBLISHED: 0 };
    for (const item of items) {
      if (item.status in c) c[item.status as keyof typeof c] += 1;
    }
    return c;
  }, [items]);

  async function withdraw(item: MyContentItem) {
    if (!accessToken) return;
    setMessage('');
    try {
      await myContentsApi.withdraw(accessToken, item.kind, item.id);
      setMessage(t('mine.withdrawn'));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    }
  }

  async function remove(item: MyContentItem) {
    if (!accessToken) return;
    if (!window.confirm(t('mine.confirmDelete'))) return;
    setMessage('');
    try {
      await myContentsApi.remove(accessToken, item.kind, item.id);
      setMessage(t('mine.deleted'));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black tracking-[1.7px] text-cac-green uppercase">{t('mine.badge')}</p>
          <h1 className="mt-2 text-[28px] font-black text-cac-navy md:text-[32px]">{t('mine.title')}</h1>
          <p className="mt-2 max-w-[760px] text-[12px] leading-relaxed text-cac-muted">{t('mine.desc')}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black">
          <span className="rounded-full bg-[#edf1f3] px-2.5 py-1 text-cac-muted">
            DRAFT {counts.DRAFT}
          </span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">
            IN_REVIEW {counts.IN_REVIEW}
          </span>
          <span className="rounded-full bg-cac-green3 px-2.5 py-1 text-cac-navy">
            PUBLISHED {counts.PUBLISHED}
          </span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black ${
              kind === k ? 'bg-cac-navy text-white' : 'bg-white text-cac-muted border border-cac-line'
            }`}
          >
            {t(`mine.kind.${k}`)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black ${
              status === s ? 'bg-cac-green3 text-cac-navy' : 'bg-white text-cac-muted border border-cac-line'
            }`}
          >
            {t(`mine.status.${s}`)}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-cac-green/30 bg-cac-green3 px-3 py-2 text-[11px] text-cac-navy">
          {message}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[16px] border border-cac-line bg-white shadow-cac">
        {loading ? (
          <p className="p-5 text-[11px] text-cac-muted">{t('mine.loading')}</p>
        ) : items.length === 0 ? (
          <div className="space-y-3 p-6">
            <p className="text-[12px] text-cac-muted">{t('mine.empty')}</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/catalog/technologies/new">
                <Button>{t('nav.newTech')}</Button>
              </Link>
              <Link to="/catalog/challenges/new">
                <Button variant="secondary">{t('nav.newChallenge')}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-cac-line">
            {items.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#edf1f3] px-1.5 py-0.5 text-[9px] font-black tracking-wide text-cac-muted">
                      {t(`mine.kind.${item.kind}`)}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-black ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[13px] font-black text-cac-navy">{item.title}</p>
                  <p className="text-[10px] text-cac-muted">
                    {item.organizationName} · {item.country} · {new Date(item.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={item.editPath}>
                    <Button variant="secondary">{t('mine.edit')}</Button>
                  </Link>
                  {item.status !== 'DRAFT' ? (
                    <Button variant="outline" onClick={() => void withdraw(item)}>
                      {t('mine.withdraw')}
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={() => void remove(item)}>
                      {t('mine.delete')}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
