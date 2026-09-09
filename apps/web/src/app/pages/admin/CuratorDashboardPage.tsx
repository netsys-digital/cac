import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { useStaffTasks } from '../../auth/StaffTasksContext';

const KPI_KEYS = [
  'organizations',
  'technologiesPublished',
  'challengesPublished',
  'offers',
  'connectionsPending',
  'representationPending',
] as const;

function kindLabel(kind: string, t: (key: string) => string) {
  const map: Record<string, string> = {
    TECHNOLOGY: t('curator.kindTech'),
    CHALLENGE: t('curator.kindChallenge'),
    PROJECT: t('curator.kindProject'),
    FUNDING_OFFER: t('curator.kindOffer'),
    SUCCESS_CASE: t('curator.kindCase'),
  };
  return map[kind] ?? kind;
}

export function CuratorDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { loading, pendingContent, pendingReps, kpis, contentCount, repCount } = useStaffTasks();
  const firstName = user?.name?.trim().split(/\s+/)[0] || t('roles.CURADOR');
  const totalTasks = contentCount + repCount;

  if (loading && !kpis) {
    return (
      <div className="rounded-2xl border border-cac-line bg-white p-5 text-media text-cac-muted shadow-cac">
        {t('dash.loading')}
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10.5rem)] flex-col gap-4 xl:gap-5">
      <header className="overflow-hidden rounded-2xl border border-cac-line bg-white shadow-cac">
        <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
          <div className="p-5 xl:p-6">
            <p className="text-pequena font-black tracking-[0.14em] text-cac-green uppercase">
              {t('curator.badge')}
            </p>
            <h1 className="mt-2 text-grande font-black leading-tight text-cac-navy">
              {t('curator.title', { name: firstName })}
            </h1>
            <p className="mt-2 max-w-2xl text-media leading-relaxed text-cac-muted">
              {t('curator.subtitle')}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-cac-line bg-[#fbfcfb] px-3 py-1.5 text-media font-black text-cac-navy">
              <span className="grid size-6 place-items-center rounded-full bg-cac-green2 text-pequena text-white">
                {totalTasks}
              </span>
              {t('curator.tasksOpen', { count: totalTasks })}
            </p>
          </div>
          <div className="border-t border-cac-line bg-[#fbfcfb] p-5 lg:border-t-0 lg:border-l xl:p-6">
            <p className="text-pequena font-black tracking-[0.12em] text-cac-green uppercase">
              {t('curator.rolesTitle')}
            </p>
            <ul className="mt-3 space-y-2 text-media text-cac-navy">
              <li className="flex gap-2">
                <span className="text-cac-green font-black">1.</span>
                {t('curator.role1')}
              </li>
              <li className="flex gap-2">
                <span className="text-cac-green font-black">2.</span>
                {t('curator.role2')}
              </li>
              <li className="flex gap-2">
                <span className="text-cac-green font-black">3.</span>
                {t('curator.role3')}
              </li>
              <li className="flex gap-2">
                <span className="text-cac-green font-black">4.</span>
                {t('curator.role4')}
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Filas prioritárias */}
      <section className="grid flex-1 gap-3 lg:grid-cols-2 xl:gap-4">
        <div className="flex flex-col rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-pequena font-black tracking-[0.12em] text-cac-green uppercase">
                {t('curator.queueContent')}
              </p>
              <h2 className="mt-1 text-grande font-black text-cac-navy">{t('admin.curateTitle')}</h2>
              <p className="mt-1 text-media text-cac-muted">{t('curator.queueContentHint')}</p>
            </div>
            <span
              className={`grid min-w-10 place-items-center rounded-full px-2.5 py-1 text-media font-black ${
                contentCount > 0 ? 'bg-amber-100 text-amber-900' : 'bg-cac-green3 text-cac-navy'
              }`}
            >
              {contentCount}
            </span>
          </div>

          <ul className="mt-4 flex-1 space-y-2">
            {pendingContent.slice(0, 4).map((item) => (
              <li
                key={`${item.kind}-${item.id}`}
                className="rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-2.5"
              >
                <p className="text-pequena font-black uppercase tracking-wide text-cac-green">
                  {kindLabel(item.kind, t)} · {t('admin.submittedForReview')}
                </p>
                <p className="mt-0.5 text-media font-black text-cac-navy">{item.title}</p>
                <p className="text-pequena text-cac-muted">{item.organization?.name ?? '—'}</p>
                {item.summary ? (
                  <p className="mt-1 line-clamp-2 text-pequena text-cac-muted">{item.summary}</p>
                ) : null}
              </li>
            ))}
            {!pendingContent.length ? (
              <li className="rounded-xl border border-dashed border-cac-line px-3 py-4 text-media text-cac-muted">
                {t('admin.curateEmpty')}
              </li>
            ) : null}
          </ul>

          <Link
            to="/admin/curate"
            className="mt-4 inline-flex items-center justify-center rounded-[12px] bg-cac-navy px-4 py-3 text-media font-black text-white transition hover:bg-cac-green2"
          >
            {contentCount > 0 ? t('curator.openCurate') : t('curator.viewCurate')}
          </Link>
        </div>

        <div className="flex flex-col rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-pequena font-black tracking-[0.12em] text-cac-green uppercase">
                {t('curator.queueRep')}
              </p>
              <h2 className="mt-1 text-grande font-black text-cac-navy">{t('admin.repTitle')}</h2>
              <p className="mt-1 text-media text-cac-muted">{t('curator.queueRepHint')}</p>
            </div>
            <span
              className={`grid min-w-10 place-items-center rounded-full px-2.5 py-1 text-media font-black ${
                repCount > 0 ? 'bg-amber-100 text-amber-900' : 'bg-cac-green3 text-cac-navy'
              }`}
            >
              {repCount}
            </span>
          </div>

          <ul className="mt-4 flex-1 space-y-2">
            {pendingReps.slice(0, 4).map((item) => (
              <li key={item.id} className="rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-2.5">
                <p className="text-media font-black text-cac-navy">
                  {item.user?.name} · {item.organization?.name}
                </p>
                <p className="text-pequena text-cac-muted">
                  {item.unit} · {item.linkRole}
                </p>
              </li>
            ))}
            {!pendingReps.length ? (
              <li className="rounded-xl border border-dashed border-cac-line px-3 py-4 text-media text-cac-muted">
                {t('admin.empty')}
              </li>
            ) : null}
          </ul>

          <Link
            to="/admin/representation"
            className="mt-4 inline-flex items-center justify-center rounded-[12px] bg-cac-navy px-4 py-3 text-media font-black text-white transition hover:bg-cac-green2"
          >
            {repCount > 0 ? t('curator.openRep') : t('curator.viewRep')}
          </Link>
        </div>
      </section>

      {/* KPIs + atalho domínios */}
      <section className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
          <p className="text-pequena font-black tracking-[0.12em] text-cac-green uppercase">
            {t('curator.kpisTitle')}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {KPI_KEYS.map((key) => (
              <div
                key={key}
                className="rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-3 text-center"
              >
                <b className="block text-grande font-black text-cac-navy">{kpis?.[key] ?? '—'}</b>
                <span className="mt-1 block text-pequena leading-snug text-cac-muted">
                  {t(`curator.kpi.${key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
          <div>
            <p className="text-pequena font-black tracking-[0.12em] text-cac-green uppercase">
              {t('curator.domainsTitle')}
            </p>
            <p className="mt-2 text-media leading-relaxed text-cac-muted">{t('curator.domainsHint')}</p>
          </div>
          <Link
            to="/admin/domains"
            className="mt-4 inline-flex items-center justify-center rounded-[12px] border border-cac-green bg-white px-4 py-3 text-media font-black text-cac-green transition hover:bg-cac-green3"
          >
            {t('nav.adminDomains')}
          </Link>
        </div>
      </section>
    </div>
  );
}
