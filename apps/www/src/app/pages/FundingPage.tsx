import { useTranslation } from 'react-i18next';
import { shell } from '../components/PageChrome';
import { FundingBrowseSection } from '../components/FundingBrowseSection';
import { urls } from '../../config';

const FUNDING_HERO_IMG = '/images/fundo_financiamento.png';
const FUNDING_PUBLISH_URL = `${urls.web}/funding-offers/new`;

const FUNDING_FEATURE_ICONS = [
  'fa-solid fa-seedling',
  'fa-solid fa-handshake',
  'fa-solid fa-chart-line',
  'fa-solid fa-globe',
] as const;

function HeroFeature({ iconClass, label }: { iconClass: string; label: string }) {
  return (
    <div className="flex w-[4.75rem] flex-col items-center gap-2 sm:w-[5.5rem]">
      <i className={`${iconClass} text-[1.85rem] text-cac-green sm:text-[2.1rem]`} aria-hidden />
      <span className="text-center text-[0.58rem] font-semibold leading-snug text-black sm:text-[0.65rem] first-letter:uppercase">
        {label}
      </span>
    </div>
  );
}

export function FundingPage() {
  const { t } = useTranslation();

  const features = [
    { iconClass: FUNDING_FEATURE_ICONS[0], label: t('funding.feature1') },
    { iconClass: FUNDING_FEATURE_ICONS[1], label: t('funding.feature2') },
    { iconClass: FUNDING_FEATURE_ICONS[2], label: t('funding.feature3') },
    { iconClass: FUNDING_FEATURE_ICONS[3], label: t('funding.feature4') },
  ];

  return (
    <div className="bg-cac-bg">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[#f4f8f9] bg-cover bg-[position:center_center] bg-no-repeat"
          style={{ backgroundImage: `url(${FUNDING_HERO_IMG})` }}
          aria-hidden
        />

        <div
          className={`${shell} relative grid items-center gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:py-16`}
        >
          <div className="cac-fade-up min-w-0 max-w-[36rem]">
            <p className="text-mini font-bold tracking-[1.7px] text-cac-green uppercase">
              {t('funding.badge')}
            </p>
            <h1 className="mt-3 text-extra-grande leading-[1.08] font-bold tracking-[-0.7px] text-cac-navy">
              {t('funding.title')}
            </h1>
            <p className="mt-4 text-media leading-relaxed text-cac-muted">{t('funding.support')}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#ofertas"
                className="inline-flex rounded-full border border-cac-navy/20 bg-white/95 px-5 py-2.5 text-pequena font-extrabold text-cac-navy transition hover:border-cac-navy/35 hover:bg-white"
              >
                {t('funding.findCta')}
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-4 sm:gap-5">
              {features.map((f) => (
                <HeroFeature key={f.label} iconClass={f.iconClass} label={f.label} />
              ))}
            </div>
          </div>

          <div className="cac-fade-up-delay relative flex min-h-[11rem] items-end justify-end self-stretch pb-1 lg:min-h-[16rem] lg:items-center lg:pr-1">
            <a
              href={FUNDING_PUBLISH_URL}
              className="group w-full max-w-[17.5rem] rounded-[18px] border border-[#e8d7a8]/80 bg-[rgba(255,251,242,.94)] px-5 py-4 backdrop-blur-[6px] transition hover:-translate-y-0.5 hover:border-cac-gold/70 hover:bg-white"
            >
              <span className="text-[0.65rem] font-extrabold tracking-[1.4px] text-cac-gold uppercase">
                {t('funding.publishCta')}
              </span>
              <span className="mt-2 block text-pequena font-bold leading-snug text-cac-navy">
                {t('funding.publishInvite')}
              </span>
              <span className="mt-3 inline-flex items-center gap-2 text-mini font-bold text-cac-green transition group-hover:gap-2.5">
                {t('funding.publishAction')}
                <i className="fa-solid fa-arrow-right text-[0.65rem]" aria-hidden />
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className={`${shell} py-8 md:py-10`}>
        <div className="cac-fade-up space-y-3 text-media leading-relaxed text-cac-muted">
          <p>{t('funding.body1')}</p>
          <p>{t('funding.body2')}</p>
          <p className="pt-1 text-pequena font-bold text-cac-navy">{t('funding.tagline')}</p>
        </div>
      </section>

      <FundingBrowseSection />
    </div>
  );
}
