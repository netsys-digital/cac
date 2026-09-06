import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { myContentsApi, type DashboardResponse } from '../api/myContentsApi';

type CardDef = {
  key: string;
  value: string | number;
  label: string;
  hint: string;
  to?: string;
  muted?: boolean;
};

export function DashboardPage() {
  const { user, accessToken } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    void myContentsApi
      .dashboard(accessToken)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'error'));
  }, [accessToken]);

  const stats = data?.stats;
  const cards: CardDef[] = [
    {
      key: 'published',
      value: stats?.published ?? '—',
      label: t('dash.published'),
      hint: data
        ? t('dash.publishedHint', {
            tech: data.breakdown.technologies,
            challenge: data.breakdown.challenges,
            offer: data.breakdown.offers,
            case: data.breakdown.cases,
          })
        : t('dash.loading'),
      to: '/my/contents',
    },
    {
      key: 'contacts',
      value: stats?.contacts ?? '—',
      label: t('dash.contacts'),
      hint: t('dash.contactsHint', { pending: stats?.connectionsPending ?? 0 }),
      to: '/my/connections',
    },
    {
      key: 'favorites',
      value: stats?.favorites ?? '—',
      label: t('dash.favorites'),
      hint: t('dash.favoritesHint', { follows: stats?.follows ?? 0 }),
      to: '/my/connections',
    },
    {
      key: 'interactions',
      value: stats?.interactions ?? '—',
      label: t('dash.interactions'),
      hint: t('dash.interactionsHint'),
      to: '/my/connections',
    },
    {
      key: 'views',
      value: stats?.viewsTracked ? (stats.views ?? 0) : '—',
      label: t('dash.views'),
      hint: t('dash.viewsHint'),
      muted: !stats?.viewsTracked,
    },
    {
      key: 'likes',
      value: stats?.likesReceived ?? '—',
      label: t('dash.likes'),
      hint: t('dash.likesHint'),
      to: '/my/contents',
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-black tracking-[1.7px] text-cac-green uppercase">
          {t('shell.signedIn')}
        </p>
        <h1 className="mt-2 text-[28px] leading-tight font-black text-cac-navy md:text-[32px]">
          {t('shell.welcome', { name: user?.name ?? '' })}
        </h1>
        <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-cac-muted">
          {t('dash.subtitle')}
        </p>
        <p className="mt-1 text-[11px] text-cac-muted">
          {user?.email} · <span className="font-black uppercase text-cac-green">{user?.role}</span>
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800">{error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const body = (
            <>
              <p className="text-[10px] font-black tracking-[1.2px] text-cac-muted uppercase">{card.label}</p>
              <p
                className={`mt-2 text-[28px] font-black leading-none ${
                  card.muted ? 'text-cac-muted' : 'text-cac-navy'
                }`}
              >
                {card.value}
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-cac-muted">{card.hint}</p>
            </>
          );
          const className = `block rounded-[16px] border border-cac-line bg-white p-4 shadow-cac transition hover:border-cac-green/40 ${
            card.to ? 'cursor-pointer' : ''
          }`;
          return card.to ? (
            <Link key={card.key} to={card.to} className={className}>
              {body}
            </Link>
          ) : (
            <div key={card.key} className={className}>
              {body}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/my/contents"
          className="rounded-[10px] bg-cac-navy px-3 py-2 text-[11px] font-black text-white"
        >
          {t('nav.myContents')}
        </Link>
        <Link
          to="/org/representation"
          className="rounded-[10px] bg-cac-green3 px-3 py-2 text-[11px] font-black text-cac-navy"
        >
          {t('nav.representation')}
        </Link>
        <Link
          to="/catalog/technologies/new"
          className="rounded-[10px] bg-cac-green3 px-3 py-2 text-[11px] font-black text-cac-navy"
        >
          {t('nav.newTech')}
        </Link>
        <Link
          to="/catalog/challenges/new"
          className="rounded-[10px] bg-cac-green3 px-3 py-2 text-[11px] font-black text-cac-navy"
        >
          {t('nav.newChallenge')}
        </Link>
        {(stats?.drafts || stats?.inReview) ? (
          <span className="rounded-[10px] border border-cac-line bg-white px-3 py-2 text-[11px] text-cac-muted">
            {t('dash.pipeline', { drafts: stats?.drafts ?? 0, review: stats?.inReview ?? 0 })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
