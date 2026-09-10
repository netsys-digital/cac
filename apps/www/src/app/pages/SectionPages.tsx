import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/PageChrome';
import { urls } from '../../config';

export function PublishChallengeLandingPage() {
  const { t } = useTranslation();
  return (
    <PageShell eyebrow={t('nav.challenge')} title={t('home.path03')}>
      <p className="mb-6 max-w-[760px] text-media text-cac-muted">{t('home.path03Body')}</p>
      <a
        href={`${urls.web}/catalog/challenges/new`}
        className="inline-flex rounded-[10px] bg-cac-green2 px-3.5 py-2.5 text-pequena font-bold text-white"
      >
        {t('home.path03')}
      </a>
    </PageShell>
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
        <Link to="/funding" className="inline-flex rounded-[10px] border border-cac-line bg-white px-3.5 py-2.5 text-pequena font-bold text-cac-navy">
          {t('nav.funding')}
        </Link>
      </div>
    </PageShell>
  );
}
