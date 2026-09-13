import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell, shell } from '../components/PageChrome';
import { urls } from '../../config';

const CHALLENGE_HERO_IMG = '/images/fundo_desafio.png';

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
              href={`${urls.web}/catalog/challenges/new`}
              className="mt-7 inline-flex rounded-full bg-cac-green2 px-6 py-3 text-pequena font-extrabold text-white shadow-[0_14px_32px_rgba(10,36,64,.28)] transition hover:brightness-105"
            >
              {t('challengeLanding.publishCta')}
            </a>
          </div>

          <div className="pointer-events-none relative min-h-[10rem] self-stretch lg:min-h-[16rem]" aria-hidden />
        </div>
      </section>
    </div>
  );
}

export function PublishOfferLandingPage() {
  const { t } = useTranslation();
  return (
    <PageShell eyebrow={t('nav.offer')} title={t('home.path04')}>
      <p className="mb-6 max-w-[760px] text-media text-cac-muted">{t('home.path04Body')}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`${urls.web}/catalog/technologies/new`}
          className="inline-flex rounded-[10px] bg-cac-green2 px-3.5 py-2.5 text-pequena font-bold text-white"
        >
          {t('home.path04')}
        </a>
        <a
          href={`${urls.web}/funding-offers/new`}
          className="inline-flex rounded-[10px] border border-cac-green bg-white px-3.5 py-2.5 text-pequena font-bold text-cac-green"
        >
          {t('funding.publishCta')}
        </a>
        <Link
          to="/funding"
          className="inline-flex rounded-[10px] border border-cac-line bg-white px-3.5 py-2.5 text-pequena font-bold text-cac-navy"
        >
          {t('nav.funding')}
        </Link>
      </div>
    </PageShell>
  );
}
