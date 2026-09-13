import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shell } from '../components/PageChrome';
import { urls } from '../../config';

const CHALLENGE_HERO_IMG = '/images/fundo_desafio.png';
const OFFER_HERO_IMG = '/images/fundo_ofereca.png';

const CHALLENGE_PUBLISH_URL = `${urls.web}/catalog/challenges/new`;

const WHY_CARDS = [
  {
    icon: 'fa-solid fa-bullseye',
    titleKey: 'challengeLanding.why1Title',
    bodyKey: 'challengeLanding.why1Body',
    bg: 'bg-[#e8f5ec]',
  },
  {
    icon: 'fa-solid fa-users',
    titleKey: 'challengeLanding.why2Title',
    bodyKey: 'challengeLanding.why2Body',
    bg: 'bg-[#e8f1fb]',
  },
  {
    icon: 'fa-solid fa-lightbulb',
    titleKey: 'challengeLanding.why3Title',
    bodyKey: 'challengeLanding.why3Body',
    bg: 'bg-[#fbf3e0]',
  },
  {
    icon: 'fa-solid fa-leaf',
    titleKey: 'challengeLanding.why4Title',
    bodyKey: 'challengeLanding.why4Body',
    bg: 'bg-[#eef7f2]',
  },
] as const;

const HOW_STEPS = [
  {
    icon: 'fa-solid fa-pen-to-square',
    titleKey: 'challengeLanding.how1Title',
    bodyKey: 'challengeLanding.how1Body',
  },
  {
    icon: 'fa-solid fa-file-lines',
    titleKey: 'challengeLanding.how2Title',
    bodyKey: 'challengeLanding.how2Body',
  },
  {
    icon: 'fa-solid fa-users',
    titleKey: 'challengeLanding.how3Title',
    bodyKey: 'challengeLanding.how3Body',
  },
  {
    icon: 'fa-solid fa-rocket',
    titleKey: 'challengeLanding.how4Title',
    bodyKey: 'challengeLanding.how4Body',
  },
] as const;

export function PublishChallengeLandingPage() {
  const { t } = useTranslation();
  return (
    <div className="bg-cac-bg">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[#f4f8f9] bg-cover bg-[position:center_center] bg-no-repeat"
          style={{ backgroundImage: `url(${CHALLENGE_HERO_IMG})` }}
          aria-hidden
        />

        <div
          className={`${shell} relative grid items-center gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:py-16`}
        >
          <div className="cac-fade-up min-w-0 max-w-[36rem]">
            <p className="text-mini font-bold tracking-[1.7px] text-cac-green uppercase">
              {t('challengeLanding.badge')}
            </p>
            <h1 className="mt-3 text-extra-grande leading-[1.08] font-bold tracking-[-0.7px] text-cac-navy">
              {t('challengeLanding.title')}
            </h1>
            <p className="mt-4 text-media leading-relaxed text-cac-muted">
              {t('challengeLanding.support')}
            </p>
            <a
              href={CHALLENGE_PUBLISH_URL}
              className="mt-7 inline-flex rounded-full bg-cac-green2 px-6 py-3 text-pequena font-extrabold text-white shadow-[0_14px_32px_rgba(10,36,64,.28)] transition hover:brightness-105"
            >
              {t('challengeLanding.publishCta')}
            </a>
          </div>

          <div className="pointer-events-none relative min-h-[10rem] self-stretch lg:min-h-[16rem]" aria-hidden />
        </div>
      </section>

      <section className={`${shell} py-10 md:py-14`}>
        <div className="max-w-[40rem]">
          <h2 className="text-grande font-bold tracking-[-0.4px] text-cac-navy">
            {t('challengeLanding.whyTitle')}
          </h2>
          <p className="mt-2 text-media leading-relaxed text-cac-muted">
            {t('challengeLanding.whySupport')}
          </p>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {WHY_CARDS.map((card) => (
            <article
              key={card.titleKey}
              className={`flex items-center gap-4 rounded-[16px] p-5 ${card.bg}`}
            >
              <i
                className={`${card.icon} shrink-0 text-[2.25rem] text-cac-green`}
                aria-hidden
              />
              <div className="min-w-0">
                <h3 className="text-media font-bold text-cac-navy">{t(card.titleKey)}</h3>
                <p className="mt-1.5 text-pequena leading-relaxed text-cac-muted">
                  {t(card.bodyKey)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${shell} pb-10 md:pb-14`}>
        <div>
          <h2 className="text-grande font-bold tracking-[-0.4px] text-cac-navy">
            {t('challengeLanding.howTitle')}
          </h2>
          <p className="mt-2 whitespace-nowrap text-media leading-relaxed text-cac-muted">
            {t('challengeLanding.howSupport')}
          </p>
        </div>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((step, index) => (
            <li
              key={step.titleKey}
              className="relative flex items-center gap-3.5 rounded-[16px] border border-cac-line bg-white px-4 py-4"
            >
              {index < HOW_STEPS.length - 1 ? (
                <span
                  className="pointer-events-none absolute top-1/2 right-[-0.7rem] hidden -translate-y-1/2 text-cac-line lg:block"
                  aria-hidden
                >
                  <i className="fa-solid fa-chevron-right text-[0.85rem]" />
                </span>
              ) : null}
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cac-green2 text-pequena font-extrabold text-white">
                {index + 1}
              </span>
              <i className={`${step.icon} shrink-0 text-[1.75rem] text-cac-green`} aria-hidden />
              <div className="min-w-0">
                <h3 className="text-media font-bold text-cac-navy">{t(step.titleKey)}</h3>
                <p className="mt-1 text-pequena leading-relaxed text-cac-muted">{t(step.bodyKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${shell} pb-14 md:pb-16`}>
        <div className="flex flex-col gap-5 rounded-[18px] bg-[#e7f4ec] px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-7">
          <div className="flex min-w-0 items-start gap-4">
            <i className="fa-solid fa-handshake mt-0.5 text-[1.75rem] text-cac-green" aria-hidden />
            <div className="min-w-0">
              <h2 className="text-media font-bold text-cac-navy sm:text-grande">
                {t('challengeLanding.ctaTitle')}
              </h2>
              <p className="mt-1.5 max-w-[36rem] text-pequena leading-relaxed text-cac-muted sm:text-media">
                {t('challengeLanding.ctaBody')}
              </p>
            </div>
          </div>
          <a
            href={CHALLENGE_PUBLISH_URL}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-cac-green2 px-6 py-3 text-pequena font-extrabold text-white shadow-[0_10px_24px_rgba(10,36,64,.18)] transition hover:brightness-105"
          >
            {t('challengeLanding.publishCta')}
            <i className="fa-solid fa-arrow-right text-[0.85rem]" aria-hidden />
          </a>
        </div>
      </section>
    </div>
  );
}

export function PublishOfferLandingPage() {
  const { t } = useTranslation();
  return (
    <div className="bg-cac-bg">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[#f4f8f9] bg-cover bg-[position:center_center] bg-no-repeat"
          style={{ backgroundImage: `url(${OFFER_HERO_IMG})` }}
          aria-hidden
        />

        <div
          className={`${shell} relative grid items-center gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:py-16`}
        >
          <div className="cac-fade-up min-w-0 max-w-[36rem]">
            <p className="text-mini font-bold tracking-[1.7px] text-cac-green uppercase">
              {t('offerLanding.badge')}
            </p>
            <h1 className="mt-3 text-extra-grande leading-[1.08] font-bold tracking-[-0.7px] text-cac-navy">
              {t('offerLanding.title')}
            </h1>
            <p className="mt-4 text-media leading-relaxed text-cac-muted">
              {t('offerLanding.support')}
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <a
                href={`${urls.web}/catalog/technologies/new`}
                className="inline-flex rounded-full bg-cac-green2 px-6 py-3 text-pequena font-extrabold text-white shadow-[0_14px_32px_rgba(10,36,64,.28)] transition hover:brightness-105"
              >
                {t('offerLanding.publishCta')}
              </a>
              <a
                href={`${urls.web}/funding-offers/new`}
                className="inline-flex rounded-full border border-cac-green bg-white/90 px-5 py-3 text-pequena font-extrabold text-cac-green backdrop-blur-sm transition hover:bg-white"
              >
                {t('funding.publishCta')}
              </a>
              <Link
                to="/funding"
                className="inline-flex rounded-full border border-cac-line bg-white/90 px-5 py-3 text-pequena font-extrabold text-cac-navy backdrop-blur-sm transition hover:bg-white"
              >
                {t('nav.funding')}
              </Link>
            </div>
          </div>

          <div className="pointer-events-none relative min-h-[10rem] self-stretch lg:min-h-[16rem]" aria-hidden />
        </div>
      </section>
    </div>
  );
}
