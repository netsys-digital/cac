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
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

function IntentIconOrg() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V8l8-4 8 4v12" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6M9 10h.01M12 10h.01M15 10h.01M9 13h.01M12 13h.01M15 13h.01" strokeLinecap="round" />
    </svg>
  );
}

function IntentIconPublish() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v12M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" strokeLinecap="round" />
    </svg>
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
    'group flex h-full flex-col rounded-[16px] border bg-white p-5 shadow-cac transition duration-200',
    locked
      ? 'border-dashed border-cac-line bg-[#f8faf9]'
      : 'border-cac-line hover:-translate-y-0.5 hover:border-cac-green/45 hover:shadow-[0_10px_28px_rgba(10,36,64,.10)]',
    recommended ? 'ring-1 ring-cac-green/35' : '',
  ].join(' ');

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid size-11 place-items-center rounded-[12px] ${
            locked ? 'bg-[#edf1f3] text-cac-muted' : 'bg-cac-green3 text-cac-navy'
          }`}
        >
          {icon}
        </span>
        <div className="flex flex-col items-end gap-1">
          {recommended && recommendedLabel ? (
            <span className="rounded-md bg-cac-green2 px-2 py-0.5 text-[9px] font-black tracking-wide text-white uppercase">
              {recommendedLabel}
            </span>
          ) : null}
          <span
            className={`text-[10px] font-black tracking-[1.2px] uppercase ${
              locked ? 'text-cac-muted' : 'text-cac-green'
            }`}
          >
            {badge}
          </span>
          {status ? (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-800">
              {status}
            </span>
          ) : null}
        </div>
      </div>

      <h2 className="mt-4 text-[16px] leading-snug font-black text-cac-navy md:text-[17px]">{title}</h2>
      <p className="mt-2 flex-1 text-[12px] leading-relaxed text-cac-muted">{body}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {locked ? (
          onSecondaryTo && secondaryCta ? (
            <Link
              to={onSecondaryTo}
              className="inline-flex rounded-[10px] bg-cac-green3 px-3 py-2 text-[11px] font-black text-cac-navy transition hover:brightness-95"
              onClick={(e) => e.stopPropagation()}
            >
              {secondaryCta}
            </Link>
          ) : null
        ) : (
          <span className="inline-flex rounded-[10px] bg-cac-navy px-3 py-2 text-[11px] font-black text-white transition group-hover:bg-cac-green2">
            {cta}
          </span>
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
      <div className="rounded-[16px] border border-cac-line bg-white p-6 text-[12px] text-cac-muted shadow-cac">
        {t('dash.loading')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="overflow-hidden rounded-[19px] border border-cac-line bg-white shadow-cac">
        <div className="border-b border-cac-line bg-[#edf1f3] px-5 py-2 font-mono text-[10px] text-[#76838a]">
          climateactionconnect · {t('onboarding.badge')}
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[1.15fr_0.85fr] md:p-6">
          <div>
            <p className="text-[10px] font-black tracking-[1.7px] text-cac-green uppercase">
              {t('onboarding.badge')}
            </p>
            <h1 className="mt-2 text-[26px] leading-tight font-black text-cac-navy md:text-[30px]">
              {t('onboarding.title', { name: user?.name?.split(' ')[0] ?? '' })}
            </h1>
            <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-cac-muted">
              {gate === 'pending' ? t('onboarding.subtitlePending') : t('onboarding.subtitle')}
            </p>
          </div>

          <div className="rounded-[14px] border border-cac-line bg-[#fbfcfb] p-4">
            <p className="text-[10px] font-black tracking-[1px] text-cac-green uppercase">
              {t('onboarding.profileTitle')}
            </p>
            <ul className="mt-3 space-y-2.5">
              {profileSteps.map((step) => (
                <li key={step.key} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-black ${
                      step.done
                        ? 'bg-cac-green2 text-white'
                        : step.current
                          ? 'bg-amber-400 text-white'
                          : 'bg-[#edf1f3] text-cac-muted'
                    }`}
                  >
                    {step.done ? '✓' : step.current ? '…' : '○'}
                  </span>
                  <span>
                    <span className="block text-[11px] font-black text-cac-navy">{step.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-cac-muted">{step.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-3">
          <h2 className="text-[14px] font-black text-cac-navy">{t('onboarding.chooseTitle')}</h2>
          <p className="mt-1 text-[11px] text-cac-muted">{t('onboarding.chooseSubtitle')}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
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
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[16px] border border-cac-line bg-white p-5 shadow-cac">
          <p className="text-[10px] font-black tracking-[1px] text-cac-green uppercase">
            {t('onboarding.timelineTitle')}
          </p>
          <p className="mt-1 text-[11px] text-cac-muted">{t('onboarding.timelineIntro')}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-5">
            {timeline.map((label, index) => {
              const done =
                index === 0 ||
                (index <= 2 && gate !== 'none') ||
                (index === 3 && canPublish) ||
                (index === 4 && canPublish);
              const waiting = index === 3 && gate === 'pending';
              return (
                <div
                  key={label}
                  className={`rounded-[11px] border p-3 ${
                    done
                      ? 'border-cac-green/40 bg-cac-green3/50'
                      : waiting
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-cac-line bg-[#fbfcfb]'
                  }`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full text-[10px] font-black text-white ${
                      done ? 'bg-cac-green2' : waiting ? 'bg-amber-500' : 'bg-[#9aadb6]'
                    }`}
                  >
                    {done ? '✓' : waiting ? '…' : index + 1}
                  </span>
                  <p className="mt-2 text-[10px] leading-snug font-black text-cac-navy">{label}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-cac-muted">{t('onboarding.timelineHint')}</p>
        </div>

        <div className="flex flex-col justify-between rounded-[16px] border border-cac-line bg-white p-5 shadow-cac">
          <div>
            <p className="text-[10px] font-black tracking-[1px] text-cac-green uppercase">
              {t('onboarding.laterTitle')}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-cac-muted">{t('onboarding.laterBody')}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/my/connections"
              className="rounded-[10px] bg-cac-navy px-3 py-2 text-[11px] font-black text-white transition hover:bg-cac-green2"
            >
              {t('nav.connections')}
            </Link>
            <a
              href={urls.www}
              className="rounded-[10px] border border-cac-green bg-white px-3 py-2 text-[11px] font-black text-cac-green transition hover:bg-cac-green3"
            >
              {t('shell.portal')}
            </a>
            <Link
              to="/org/representation"
              className="rounded-[10px] border border-cac-line bg-white px-3 py-2 text-[11px] font-black text-cac-navy transition hover:bg-cac-bg"
            >
              {t('nav.representation')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
