import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { urls } from '../../config';
import { useAuth } from '../auth/AuthContext';
import { useRepresentation } from '../auth/RepresentationContext';
import { useStaffTasks } from '../auth/StaffTasksContext';
import { myContentsApi, type DashboardResponse } from '../api/myContentsApi';

type CardDef = {
  key: string;
  value: string | number;
  label: string;
  hint: string;
  to?: string;
  muted?: boolean;
};

/** Dashboard operacional — ADMIN (plataforma) ou ORG com representação aprovada. */
export function DashboardPage() {
  const { user, accessToken } = useAuth();
  const { isAdmin } = useRepresentation();
  const { contentCount, repCount } = useStaffTasks();
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
        <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">
          {isAdmin ? t('dash.adminBadge') : t('shell.signedIn')}
        </p>
        <h1 className="mt-2 text-grande leading-tight font-bold text-cac-navy">
          {t('shell.welcome', { name: user?.name ?? '' })}
        </h1>
        <p className="mt-2 max-w-2xl text-pequena leading-relaxed text-cac-muted">
          {isAdmin ? t('dash.subtitleAdmin') : t('dash.subtitle')}
        </p>
        <p className="mt-1 text-pequena text-cac-muted">
          {user?.email} ·{' '}
          <span className="font-bold uppercase text-cac-green">
            {user?.role ? t(`roles.${user.role}`) : user?.role}
          </span>
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-800">{error}</p>
      ) : null}

      {isAdmin ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link
            to="/admin/curate"
            className="rounded-[16px] border border-cac-line bg-white p-4 shadow-cac transition hover:border-cac-green/40"
          >
            <p className="text-mini font-extrabold tracking-[1.2px] text-cac-green uppercase">
              {t('nav.adminCurate')}
            </p>
            <p className="mt-2 text-grande font-bold leading-none text-cac-navy">{contentCount}</p>
            <p className="mt-3 text-pequena text-cac-muted">{t('dash.adminCurateHint')}</p>
          </Link>
          <Link
            to="/admin/representation"
            className="rounded-[16px] border border-cac-line bg-white p-4 shadow-cac transition hover:border-cac-green/40"
          >
            <p className="text-mini font-extrabold tracking-[1.2px] text-cac-green uppercase">
              {t('nav.adminRep')}
            </p>
            <p className="mt-2 text-grande font-bold leading-none text-cac-navy">{repCount}</p>
            <p className="mt-3 text-pequena text-cac-muted">{t('dash.adminRepHint')}</p>
          </Link>
          <Link
            to="/admin/users"
            className="rounded-[16px] border border-cac-line bg-white p-4 shadow-cac transition hover:border-cac-green/40"
          >
            <p className="text-mini font-extrabold tracking-[1.2px] text-cac-green uppercase">
              {t('nav.adminUsers')}
            </p>
            <p className="mt-2 text-media font-bold text-cac-navy">{t('admin.usersTitle')}</p>
            <p className="mt-3 text-pequena text-cac-muted">{t('dash.adminUsersHint')}</p>
          </Link>
          <Link
            to="/admin/domains"
            className="rounded-[16px] border border-cac-line bg-white p-4 shadow-cac transition hover:border-cac-green/40"
          >
            <p className="text-mini font-extrabold tracking-[1.2px] text-cac-green uppercase">
              {t('nav.adminDomains')}
            </p>
            <p className="mt-2 text-media font-bold text-cac-navy">{t('dash.adminDomainsTitle')}</p>
            <p className="mt-3 text-pequena text-cac-muted">{t('dash.adminDomainsHint')}</p>
          </Link>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const body = (
            <>
              <p className="text-mini font-bold tracking-[1.2px] text-cac-muted uppercase">{card.label}</p>
              <p
                className={`mt-2 text-grande font-bold leading-none ${
                  card.muted ? 'text-cac-muted' : 'text-cac-navy'
                }`}
              >
                {card.value}
              </p>
              <p className="mt-3 text-pequena leading-relaxed text-cac-muted">{card.hint}</p>
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
        <a
          href={urls.www}
          className="rounded-[10px] bg-cac-navy px-3 py-2 text-pequena font-extrabold text-white"
        >
          {t('dash.goPortal')}
        </a>
        <Link
          to="/my/connections"
          className="rounded-[10px] bg-cac-green3 px-3 py-2 text-pequena font-extrabold text-cac-navy"
        >
          {t('nav.connections')}
        </Link>
        <Link
          to="/my/contents"
          className="rounded-[10px] border border-cac-line bg-white px-3 py-2 text-pequena font-extrabold text-cac-navy"
        >
          {t('nav.myContents')}
        </Link>
        <Link
          to="/catalog/technologies/new"
          className="rounded-[10px] border border-cac-line bg-white px-3 py-2 text-pequena font-extrabold text-cac-navy"
        >
          {t('nav.newTech')}
        </Link>
        <Link
          to="/catalog/challenges/new"
          className="rounded-[10px] border border-cac-line bg-white px-3 py-2 text-pequena font-extrabold text-cac-navy"
        >
          {t('nav.newChallenge')}
        </Link>
        {isAdmin ? (
          <>
            <Link
              to="/admin/users"
              className="rounded-[10px] border border-cac-green bg-white px-3 py-2 text-pequena font-extrabold text-cac-green"
            >
              {t('nav.adminUsers')}
            </Link>
            <Link
              to="/admin/curate"
              className="rounded-[10px] border border-cac-green bg-white px-3 py-2 text-pequena font-extrabold text-cac-green"
            >
              {t('nav.adminCurate')}
            </Link>
            <Link
              to="/admin/domains"
              className="rounded-[10px] border border-cac-line bg-white px-3 py-2 text-pequena font-extrabold text-cac-navy"
            >
              {t('nav.adminDomains')}
            </Link>
          </>
        ) : null}
        {stats?.drafts || stats?.inReview ? (
          <span className="rounded-[10px] border border-cac-line bg-white px-3 py-2 text-pequena text-cac-muted">
            {t('dash.pipeline', { drafts: stats?.drafts ?? 0, review: stats?.inReview ?? 0 })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
