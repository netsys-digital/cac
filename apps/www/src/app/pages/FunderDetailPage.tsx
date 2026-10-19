import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fundingApi, type FunderProfile } from '../api/fundingApi';
import {
  CatalogDetailBody,
  CatalogDetailHero,
  DetailActionStack,
  DetailHeroStatCard,
  DetailHeroStatGrid,
  DetailFavoriteButton,
  DetailOrgCard,
  DetailSecondaryButton,
  DetailSection,
} from '../components/CatalogDetail';
import { DetailConnectionActions } from '../components/DetailConnectionActions';
import { DetailGuestAuthHint } from '../components/DetailGuestAuthHint';
import { BackLink } from '../components/BackLink';
import { shell } from '../components/PageChrome';
import { urls } from '../../config';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { RichText } from '../lib/richText';

const REGION_KEYS: Record<string, string> = {
  africa: 'funding.regionAfrica',
  asia: 'funding.regionAsia',
  europe: 'funding.regionEurope',
  north_america: 'funding.regionNorthAmerica',
  south_america: 'funding.regionSouthAmerica',
  oceania: 'funding.regionOceania',
};

export function FunderDetailPage() {
  const { slug = '' } = useParams();
  const { t, i18n } = useTranslation();
  const [item, setItem] = useState<FunderProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    setItem(null);
    void fundingApi
      .getFunder(slug)
      .then((res) => {
        if (!cancelled) setItem(res.funder);
      })
      .catch(() => {
        if (!cancelled) setError(t('detail.notFound'));
      });
    return () => {
      cancelled = true;
    };
  }, [slug, t, i18n.language]);

  if (error) {
    return (
      <div className={`${shell} py-12`}>
        <h1 className="text-extra-grande font-bold text-cac-navy">{t('detail.notFound')}</h1>
        <div className="mt-4">
          <BackLink className="inline-flex items-center gap-2 rounded-[10px] border border-cac-line bg-white px-3.5 py-2.5 text-pequena font-bold text-cac-navy" />
        </div>
      </div>
    );
  }

  if (!item) {
    return <div className={`${shell} py-10 text-cac-muted`}>{t('detail.loading')}</div>;
  }

  const regionKey = item.region ? REGION_KEYS[item.region] : undefined;
  const regionLabel = regionKey ? t(regionKey) : item.region;
  const connectUrl = `${urls.web}/login?returnUrl=${encodeURIComponent(`/connections/new?targetType=FUNDER&targetId=${item.id}`)}`;
  const cards = [
    item.country
      ? { label: t('search.filters.country'), value: item.country, icon: 'fa-solid fa-flag' }
      : null,
    regionLabel
      ? { label: t('search.filters.region'), value: regionLabel, icon: 'fa-solid fa-globe' }
      : null,
  ].filter((card): card is { label: string; value: string; icon: string } => Boolean(card));

  return (
    <div className="bg-cac-bg">
      <CatalogDetailHero
        eyebrow={t('funding.detailBadge')}
        title={item.name}
        summary={item.summary}
        aside={
          cards.length > 0 ? (
            <DetailHeroStatGrid>
              {cards.map((card) => (
                <DetailHeroStatCard key={card.label} label={card.label} value={card.value} icon={card.icon} />
              ))}
            </DetailHeroStatGrid>
          ) : undefined
        }
      />

      <CatalogDetailBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.7fr)] lg:gap-8">
          <article className="cac-fade-up rounded-[18px] border border-cac-line bg-white px-5 py-2 shadow-[0_16px_40px_rgba(10,36,64,.07)] md:px-8">
            <DetailSection title={t('funding.detailAbout')} index="01">
              {resolveMediaUrl(item.logoUrl) ? (
                <img
                  src={resolveMediaUrl(item.logoUrl)!}
                  alt=""
                  className="mb-4 h-20 w-20 rounded-2xl border border-cac-line bg-white object-contain p-2"
                />
              ) : null}
              <RichText text={item.summary} />
            </DetailSection>
            {item.interestAreas ? (
              <DetailSection title={t('funding.detailInterest')} index="02">
                <RichText text={item.interestAreas} />
              </DetailSection>
            ) : null}
            {item.website ? (
              <DetailSection title={t('funding.detailWebsite')} index={item.interestAreas ? '03' : '02'}>
                <p className="text-cac-muted">{t('funding.detailWebsiteBody')}</p>
                <a
                  href={item.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-[12px] bg-cac-green2 px-5 py-3 text-pequena font-extrabold text-white transition hover:brightness-105"
                >
                  {t('funding.detailWebsiteCta')}
                  <span aria-hidden>→</span>
                </a>
              </DetailSection>
            ) : null}
            {item.contactName || item.contactEmail ? (
              <DetailSection title={t('funding.detailContact')} index="04">
                {item.contactName ? <p className="font-bold text-cac-navy">{item.contactName}</p> : null}
                {item.contactEmail ? (
                  <a href={`mailto:${item.contactEmail}`} className="mt-1 inline-block font-bold text-cac-green hover:underline">
                    {item.contactEmail}
                  </a>
                ) : null}
              </DetailSection>
            ) : null}
            <DetailSection title={t('detail.nextSteps')} index="05">
              <p className="text-cac-muted">{t('funding.detailNextSteps')}</p>
            </DetailSection>
          </article>

          <aside className="cac-fade-up-delay-2 space-y-4">
            {item.organization ? (
              <DetailOrgCard
                to={`/organizations/${item.organization.slug}`}
                name={item.organization.name}
                summary={item.organization.summary}
                logoUrl={item.organization.logoUrl}
                label={t('detail.organization')}
                verifiedLabel={t('detail.verified')}
                verified={item.organization.verificationStatus === 'VERIFIED'}
              />
            ) : null}
            <DetailActionStack>
              <p className="text-mini font-bold tracking-[1.4px] text-cac-muted uppercase">{t('detail.actions')}</p>
              <DetailConnectionActions connectUrl={connectUrl} targetType="FUNDER" targetId={item.id} />
              <DetailFavoriteButton targetType="FUNDER" targetId={item.id} />
              <DetailSecondaryButton href={`${urls.web}/funding-offers/new`}>
                {t('funding.publishCta')}
              </DetailSecondaryButton>
              <DetailGuestAuthHint />
            </DetailActionStack>
            <Link to="/funding?tab=directory" className="block text-center text-pequena font-bold text-cac-green hover:underline">
              {t('funding.backDirectory')}
            </Link>
          </aside>
        </div>
      </CatalogDetailBody>
    </div>
  );
}
