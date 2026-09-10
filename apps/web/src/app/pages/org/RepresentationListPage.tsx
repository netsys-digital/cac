import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { RepresentationStatus } from '@cac/shared';
import { useRepresentation } from '../../auth/RepresentationContext';
import type { RepresentationRequest } from '../../api/catalogApi';
import { resolveMediaUrl } from '../../components/forms/RepresentativeImageField';

function statusClass(status: string) {
  if (status === RepresentationStatus.APPROVED) return 'bg-cac-green3 text-cac-navy';
  if (status === RepresentationStatus.REJECTED) return 'bg-red-100 text-red-900';
  return 'bg-amber-100 text-amber-900';
}

function statusLabel(status: string, t: (key: string) => string) {
  if (status === RepresentationStatus.APPROVED) return t('rep.statusApproved');
  if (status === RepresentationStatus.REJECTED) return t('rep.statusRejected');
  if (status === RepresentationStatus.UNDER_REVIEW) return t('rep.statusUnderReview');
  return t('rep.statusRequested');
}

function orgInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function RepresentationCard({ item }: { item: RepresentationRequest }) {
  const { t } = useTranslation();
  const name = item.organization?.name ?? t('rep.organizationUnknown');
  const logo = resolveMediaUrl(item.organization?.logoUrl);

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-cac-line bg-white shadow-cac">
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-cac-line bg-[#edf1f3]">
            {logo ? (
              <img src={logo} alt="" className="h-full w-full object-contain p-1.5" />
            ) : (
              <span className="text-media font-extrabold text-cac-navy">{orgInitials(name) || '—'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-media font-bold text-cac-navy">{name}</p>
            <p className="mt-0.5 line-clamp-2 text-pequena text-cac-muted">
              {[item.unit, item.linkRole].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-mini font-bold uppercase tracking-wide ${statusClass(item.status)}`}
        >
          {statusLabel(item.status, t)}
        </span>
        {item.interest ? (
          <p className="line-clamp-3 rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-2 text-pequena text-cac-navy">
            {item.interest}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function RepresentationListPage() {
  const { t } = useTranslation();
  const { loading, requests, isStaff, refresh } = useRepresentation();

  if (isStaff) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">
            {t('rep.pageBadge')}
          </p>
          <h1 className="mt-2 text-grande font-bold text-cac-navy">{t('rep.listTitle')}</h1>
          <p className="mt-2 max-w-[760px] text-pequena leading-relaxed text-cac-muted">
            {t('rep.listDesc')}
          </p>
        </div>
        <Link
          to="/org/representation/new"
          className="inline-flex shrink-0 rounded-[12px] bg-cac-navy px-4 py-2.5 text-media font-extrabold text-white transition hover:bg-cac-green2"
        >
          {t('rep.newLink')}
        </Link>
      </header>

      {loading ? (
        <p className="rounded-2xl border border-cac-line bg-white p-5 text-media text-cac-muted shadow-cac">
          {t('dash.loading')}
        </p>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cac-line bg-white px-5 py-10 text-center shadow-cac">
          <p className="text-media font-bold text-cac-navy">{t('rep.listEmptyTitle')}</p>
          <p className="mx-auto mt-2 max-w-lg text-pequena text-cac-muted">{t('rep.listEmptyBody')}</p>
          <Link
            to="/org/representation/new"
            className="mt-5 inline-flex rounded-[12px] bg-cac-green px-4 py-2.5 text-media font-extrabold text-white transition hover:brightness-95"
          >
            {t('rep.newLink')}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {requests.map((item) => (
            <RepresentationCard key={item.id} item={item} />
          ))}
        </ul>
      )}

      {!loading && requests.length > 0 ? (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => void refresh()}>
            {t('rep.refreshList')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
