import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { urls } from '../../../config';
import { useAuth } from '../../auth/AuthContext';
import { useRepresentation } from '../../auth/RepresentationContext';

type IntentCardProps = {
  badge: string;
  title: string;
  body: string;
  cta: string;
  icon: ReactNode;
  recommended?: boolean;
  recommendedLabel?: string;
  locked?: boolean;
  status?: string;
  href?: string;
  to?: string;
  onSecondaryTo?: string;
  secondaryCta?: string;
};

function IntentIconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 xl:size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

function IntentIconOrg() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 xl:size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V8l8-4 8 4v12" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6M9 10h.01M12 10h.01M15 10h.01M9 13h.01M12 13h.01M15 13h.01" strokeLinecap="round" />
    </svg>
  );
}

function IntentIconPublish() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 xl:size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v12M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" strokeLinecap="round" />
    </svg>
  );
}

function PhaseArrow() {
  return (
    <>
      {/* Desktop: seta lateral entre fases */}
      <div
        className="hidden shrink-0 items-center justify-center self-center px-1 text-cac-green xl:flex"
        aria-hidden
      >
        <svg viewBox="0 0 48 64" className="h-16 w-11" fill="none">
          <path
            d="M8 8 L36 32 L8 56"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 8 L48 32 L20 56"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
          />
        </svg>
      </div>
      {/* Mobile/tablet: seta vertical entre fases */}
      <div className="flex justify-center py-1 text-cac-green xl:hidden" aria-hidden>
        <svg viewBox="0 0 64 48" className="h-10 w-14" fill="none">
          <path
            d="M8 8 L32 36 L56 8"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 20 L32 48 L56 20"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
          />
        </svg>
      </div>
    </>
  );
}

function IntentCard({
  badge,
  title,
  body,
  cta,
  icon,
  recommended,
  recommendedLabel,
  locked,
  status,
  href,
  to,
  onSecondaryTo,
  secondaryCta,
}: IntentCardProps) {
  const shellClass = [
    'group flex h-full min-h-0 flex-col items-center rounded-2xl border bg-white p-5 text-center shadow-cac transition duration-200 xl:p-6',
    locked
      ? 'border-dashed border-cac-line bg-[#f8faf9]'
      : 'border-cac-line hover:-translate-y-0.5 hover:border-cac-green/45',
    recommended ? 'ring-1 ring-cac-green/35' : '',
  ].join(' ');

  const ctaClass = locked
    ? 'inline-flex w-full max-w-xs items-center justify-center rounded-[12px] bg-cac-green3 px-5 py-3.5 text-media font-extrabold text-cac-navy transition hover:brightness-95 xl:py-4 xl:text-grande'
    : 'inline-flex w-full max-w-xs items-center justify-center rounded-[12px] bg-cac-navy px-5 py-3.5 text-media font-extrabold text-white transition group-hover:bg-cac-green2 xl:py-4 xl:text-grande';

  const content = (
    <>
      <div className="flex w-full flex-col items-center gap-3">
        <span
          className={`grid size-12 place-items-center rounded-xl xl:size-14 ${
            locked ? 'bg-[#edf1f3] text-cac-muted' : 'bg-cac-green3 text-cac-navy'
          }`}
        >
          {icon}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span
            className={`text-pequena font-extrabold tracking-[0.08em] uppercase ${
              locked ? 'text-cac-muted' : 'text-cac-green'
            }`}
          >
            {badge}
          </span>
          {recommended && recommendedLabel ? (
            <span className="rounded-md bg-cac-green2 px-2 py-0.5 text-mini font-bold tracking-wide text-white uppercase xl:text-pequena">
              {recommendedLabel}
            </span>
          ) : null}
          {status ? (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-mini font-bold uppercase tracking-wide text-amber-800 xl:text-pequena">
              {status}
            </span>
          ) : null}
        </div>
        <h2 className="text-grande leading-snug font-bold text-cac-navy">{title}</h2>
      </div>

      <p className="mt-3 flex-1 text-media leading-relaxed text-cac-muted">{body}</p>

      <div className="mt-5 flex w-full justify-center">
        {locked ? (
          onSecondaryTo && secondaryCta ? (
            <Link
              to={onSecondaryTo}
              className={ctaClass}
              onClick={(e) => e.stopPropagation()}
            >
              {secondaryCta}
            </Link>
          ) : null
        ) : (
          <span className={ctaClass}>{cta}</span>
        )}
      </div>
    </>
  );

  if (locked) {
    return <div className={shellClass}>{content}</div>;
  }

  if (href) {
    return (
      <a href={href} className={shellClass}>
        {content}
      </a>
    );
  }

  return (
    <Link to={to ?? '/'} className={shellClass}>
      {content}
    </Link>
  );
}

export function OnboardingIntentPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { canPublish, gate, loading } = useRepresentation();

  const profileSteps = [
    {
      key: 'account',
      label: t('onboarding.profileAccount'),
      done: true,
      detail: t('onboarding.profileAccountDone'),
    },
    {
      key: 'org',
      label: t('onboarding.profileOrg'),
      done: gate === 'pending' || gate === 'approved',
      current: gate === 'none',
      detail:
        gate === 'none'
          ? t('onboarding.profileOrgMissing')
          : gate === 'pending'
            ? t('onboarding.profileOrgPending')
            : t('onboarding.profileOrgDone'),
    },
    {
      key: 'publish',
      label: t('onboarding.profilePublish'),
      done: canPublish,
      current: gate === 'pending',
      detail: canPublish ? t('onboarding.profilePublishDone') : t('onboarding.profilePublishLocked'),
    },
  ];

  const timeline = [
    t('onboarding.timeline1'),
    t('onboarding.timeline2'),
    t('onboarding.timeline3'),
    t('onboarding.timeline4'),
    t('onboarding.timeline5'),
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-cac-line bg-white p-5 text-media text-cac-muted shadow-cac">
        {t('dash.loading')}
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10.5rem)] flex-col gap-4 xl:gap-5">
      {/* Topo */}
      <header className="shrink-0 overflow-hidden rounded-2xl border border-cac-line bg-white shadow-cac">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)_minmax(220px,0.75fr)]">
          <div className="p-5 xl:p-6">
            <p className="text-pequena font-extrabold tracking-[0.14em] text-cac-green uppercase">
              {t('onboarding.badge')}
            </p>
            <h1 className="mt-2 text-grande leading-tight font-bold text-cac-navy">
              {t('onboarding.title', { name: user?.name?.split(' ')[0] ?? '' })}
            </h1>
            <p className="mt-2 max-w-3xl text-media leading-relaxed text-cac-muted">
              {gate === 'pending' ? t('onboarding.subtitlePending') : t('onboarding.subtitle')}
            </p>
          </div>

          <div className="border-t border-cac-line bg-[#fbfcfb] p-5 lg:border-t-0 lg:border-l xl:p-6">
            <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
              {t('onboarding.profileTitle')}
            </p>
            <ul className="mt-3 space-y-2.5">
              {profileSteps.map((step) => (
                <li key={step.key} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-mini font-bold xl:size-6 xl:text-pequena ${
                      step.done
                        ? 'bg-cac-green2 text-white'
                        : step.current
                          ? 'bg-amber-400 text-white'
                          : 'bg-[#edf1f3] text-cac-muted'
                    }`}
                  >
                    {step.done ? '✓' : step.current ? '…' : '○'}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-media font-bold leading-snug text-cac-navy">
                      {step.label}
                    </span>
                    <span className="mt-0.5 block text-pequena leading-snug text-cac-muted xl:text-media">
                      {step.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-center gap-3 border-t border-cac-line p-5 lg:border-t-0 lg:border-l xl:p-6">
            <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
              {t('onboarding.laterTitle')}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Link
                to="/my/connections"
                className="inline-flex justify-center rounded-[10px] bg-cac-navy px-3.5 py-2.5 text-media font-extrabold text-white transition hover:bg-cac-green2"
              >
                {t('nav.connections')}
              </Link>
              <a
                href={urls.www}
                className="inline-flex justify-center rounded-[10px] border border-cac-green bg-white px-3.5 py-2.5 text-media font-extrabold text-cac-green transition hover:bg-cac-green3"
              >
                {t('shell.portal')}
              </a>
              <Link
                to="/org/representation"
                className="inline-flex justify-center rounded-[10px] border border-cac-line bg-white px-3.5 py-2.5 text-media font-extrabold text-cac-navy transition hover:bg-cac-bg"
              >
                {t('nav.representation')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Ações — crescem no desktop para ocupar a altura */}
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-grande font-bold text-cac-navy">{t('onboarding.chooseTitle')}</h2>
          <p className="text-media text-cac-muted">{t('onboarding.chooseSubtitle')}</p>
        </div>
        <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-stretch xl:gap-0">
          <div className="min-w-0 flex-1">
            <IntentCard
              badge={t('onboarding.exploreBadge')}
              title={t('onboarding.exploreTitle')}
              body={t('onboarding.exploreBody')}
              cta={t('onboarding.exploreCta')}
              icon={<IntentIconSearch />}
              recommended={gate === 'none'}
              recommendedLabel={t('onboarding.recommended')}
              href={urls.www}
            />
          </div>
          <PhaseArrow />
          <div className="min-w-0 flex-1">
            <IntentCard
              badge={t('onboarding.repBadge')}
              title={t('onboarding.repTitle')}
              body={t('onboarding.repBody')}
              cta={t('onboarding.repCta')}
              icon={<IntentIconOrg />}
              to="/org/representation"
              recommended={gate === 'pending'}
              recommendedLabel={t('onboarding.pendingBadge')}
              status={gate === 'none' ? t('onboarding.nextStep') : undefined}
            />
          </div>
          <PhaseArrow />
          <div className="min-w-0 flex-1">
            <IntentCard
              badge={t('onboarding.publishBadge')}
              title={t('onboarding.publishTitle')}
              body={canPublish ? t('onboarding.publishBodyReady') : t('onboarding.publishBodyLocked')}
              cta={t('onboarding.publishCta')}
              icon={<IntentIconPublish />}
              locked={!canPublish}
              to={canPublish ? '/catalog/technologies/new' : undefined}
              onSecondaryTo="/org/representation"
              secondaryCta={t('onboarding.goRepresentation')}
            />
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="shrink-0 rounded-2xl border border-cac-line bg-white px-4 py-4 shadow-cac xl:px-5 xl:py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
            {t('onboarding.timelineTitle')}
          </p>
          <p className="text-media text-cac-muted">{t('onboarding.timelineHintShort')}</p>
        </div>
        <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-1.5">
          {timeline.map((label, index) => {
            const done =
              index === 0 ||
              (index <= 2 && gate !== 'none') ||
              (index === 3 && canPublish) ||
              (index === 4 && canPublish);
            const waiting = index === 3 && gate === 'pending';
            return (
              <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
                <div
                  className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 xl:py-3 ${
                    done
                      ? 'border-cac-green/40 bg-cac-green3/50'
                      : waiting
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-cac-line bg-[#fbfcfb]'
                  }`}
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-pequena font-bold text-white xl:size-7 ${
                      done ? 'bg-cac-green2' : waiting ? 'bg-amber-500' : 'bg-[#9aadb6]'
                    }`}
                  >
                    {done ? '✓' : waiting ? '…' : index + 1}
                  </span>
                  <span className="truncate text-media font-bold text-cac-navy">{label}</span>
                </div>
                {index < timeline.length - 1 ? (
                  <span className="hidden text-cac-muted sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
