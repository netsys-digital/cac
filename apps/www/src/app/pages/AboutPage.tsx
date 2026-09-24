import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { shell } from '../components/PageChrome';

const ABOUT_HERO_IMG = '/images/fundo_busca.png';

const LINK_CARDS = [
  {
    to: '/offer',
    titleKey: 'aboutPage.cardSolutionsTitle',
    bodyKey: 'aboutPage.cardSolutionsBody',
    iconClass: 'fa-solid fa-seedling',
    iconBg: 'bg-[#e8f6ee]',
    iconColor: 'text-[#13865a]',
  },
  {
    to: '/funding',
    titleKey: 'aboutPage.cardFundingTitle',
    bodyKey: 'aboutPage.cardFundingBody',
    iconClass: 'fa-solid fa-coins',
    iconBg: 'bg-[#fff1ca]',
    iconColor: 'text-[#d59c28]',
  },
  {
    to: '/challenge',
    titleKey: 'aboutPage.cardChallengesTitle',
    bodyKey: 'aboutPage.cardChallengesBody',
    iconClass: 'fa-solid fa-bullhorn',
    iconBg: 'bg-[#e4eff8]',
    iconColor: 'text-[#2d6e9f]',
  },
  {
    to: '/cases',
    titleKey: 'aboutPage.cardCasesTitle',
    bodyKey: 'aboutPage.cardCasesBody',
    iconClass: 'fa-solid fa-book-open',
    iconBg: 'bg-[#dff3e9]',
    iconColor: 'text-[#13865a]',
  },
] as const;

function ArrowCircle() {
  return (
    <span className="grid size-8 place-items-center rounded-full bg-[#dff3e9] text-cac-green transition group-hover:bg-cac-green2 group-hover:text-white">
      <i className="fa-solid fa-arrow-right text-[0.7rem]" aria-hidden />
    </span>
  );
}

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-cac-bg">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[#f4f8f9] bg-cover bg-[position:center_center] bg-no-repeat"
          style={{ backgroundImage: `url(${ABOUT_HERO_IMG})` }}
          aria-hidden
        />

        <div
          className={`${shell} relative grid items-center gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:py-16`}
        >
          <div className="cac-fade-up min-w-0 max-w-[36rem]">
            <p className="text-mini font-bold tracking-[1.7px] text-cac-green uppercase">
              {t('aboutPage.badge')}
            </p>
            <h1 className="mt-3 text-extra-grande leading-[1.08] font-bold tracking-[-0.7px] text-cac-navy">
              {t('aboutPage.title')}
            </h1>
          </div>

          <div className="pointer-events-none relative min-h-[10rem] self-stretch lg:min-h-[16rem]" aria-hidden />
        </div>
      </section>

      <section className={`${shell} py-10 md:py-14`}>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
          <div className="cac-fade-up max-w-[42rem] space-y-4 text-media leading-relaxed text-cac-muted">
            <p>{t('aboutPage.body1')}</p>
            <p>{t('aboutPage.body2')}</p>
            <p>
              <Trans
                i18nKey="aboutPage.body3"
                components={{ strong: <strong className="font-bold text-cac-navy" /> }}
              />
            </p>
            <p className="pt-2 text-media font-bold text-cac-navy">{t('aboutPage.tagline')}</p>
          </div>

          <div className="cac-fade-up-delay grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LINK_CARDS.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="group flex min-h-[9.5rem] flex-col rounded-[16px] border border-cac-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-cac-green/35"
              >
                <span className={`mb-3 grid size-10 place-items-center rounded-full ${card.iconBg}`}>
                  <i className={`${card.iconClass} text-[1.05rem] ${card.iconColor}`} aria-hidden />
                </span>
                <span className="text-pequena font-bold leading-snug text-cac-navy">
                  {t(card.titleKey)}
                </span>
                <span className="mt-1.5 flex-1 text-mini leading-snug text-cac-muted">
                  {t(card.bodyKey)}
                </span>
                <span className="mt-3 self-end">
                  <ArrowCircle />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
