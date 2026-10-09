import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@cac/shared';
import { fundingApi, type FundingOffer } from '../api/fundingApi';
import {
  CatalogDetailBody,
  CatalogDetailBanner,
  CatalogDetailHero,
  DetailActionStack,
  DetailHeroStatCard,
  DetailHeroStatGrid,
  DetailOrgCard,
  DetailSecondaryButton,
  DetailFavoriteButton,
  DetailSection,
} from '../components/CatalogDetail';
import { DetailConnectionActions } from '../components/DetailConnectionActions';
import { DetailGuestAuthHint } from '../components/DetailGuestAuthHint';
import { BackLink } from '../components/BackLink';
import { useTrackView } from '../hooks/useTrackView';
import { shell } from '../components/PageChrome';
import {
  DocumentsSection,
  GallerySection,
  usePublicationAttachments,
} from '../components/PublicationAttachments';
import { urls } from '../../config';
import { resolveDetailBanner } from '../lib/detailBanner';
import { RichText } from '../lib/richText';

export function FundingOfferDetailPage() {
  const { slug = '' } = useParams();
  const { t, i18n } = useTranslation();
  const [item, setItem] = useState<FundingOffer | null>(null);
  const [error, setError] = useState('');
  const attachments = usePublicationAttachments('funding-offers', item?.id);
  useTrackView('FUNDING_OFFER', item?.id);

  useEffect(() => {
    let cancelled = false;
    setError('');
    setItem(null);
    void fundingApi
      .getOffer(slug)
      .then((res) => {
        if (!cancelled) setItem(res.offer);
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

  const deadlineLabel = item.deadline ? formatDate(item.deadline, i18n.language) : null;
  const connectUrl = `${urls.web}/login?returnUrl=${encodeURIComponent(`/connections/new?targetType=FUNDING_OFFER&targetId=${item.id}`)}`;

  const conditionCards = [
    item.amountRange
      ? { label: t('detail.amountRange'), value: item.amountRange, icon: 'fa-solid fa-coins' }
      : null,
    {
      label: t('funding.deadline'),
      value: deadlineLabel ?? t('funding.noDeadline'),
      icon: 'fa-solid fa-calendar-days',
    },
    item.region
      ? { label: t('search.filters.region'), value: item.region, icon: 'fa-solid fa-globe' }
      : null,
    item.country
      ? { label: t('search.filters.country'), value: item.country, icon: 'fa-solid fa-flag' }
      : null,
  ].filter((c): c is { label: string; value: string; icon: string } => Boolean(c));

  const banner = resolveDetailBanner(item, item.organization, 'FUNDING_OFFER');
  let sectionIndex = 1;
  const nextIndex = () => String(++sectionIndex).padStart(2, '0');
  const bannerEl = (
    <CatalogDetailBanner
      bannerUrl={banner.url}
      linkUrl={banner.linkUrl}
      position={banner.position}
    />
  );

  return (
    <div className="bg-cac-bg">
      <CatalogDetailHero
        eyebrow={t('detail.fundingBadge')}
        title={item.title}
        summary={item.summary}
        topBanner={banner.position === 'ABOVE_HERO' ? bannerEl : undefined}
        aside={
          conditionCards.length > 0 ? (
            <DetailHeroStatGrid>
              {conditionCards.map((card) => (
                <DetailHeroStatCard key={card.label} label={card.label} value={card.value} icon={card.icon} />
              ))}
            </DetailHeroStatGrid>
          ) : undefined
        }
      />
      {banner.position === 'BELOW_HERO' ? bannerEl : null}

      <CatalogDetailBody pullUp={banner.position !== 'BELOW_HERO'}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.7fr)] lg:gap-8">
          <article className="cac-fade-up rounded-[18px] border border-cac-line bg-white px-5 py-2 shadow-[0_16px_40px_rgba(10,36,64,.07)] md:px-8">
            {item.whatFunds ? (
              <DetailSection title={t('detail.whatFunds')} index="01">
                <RichText text={item.whatFunds} />
              </DetailSection>
            ) : (
              <DetailSection title={t('detail.whatFunds')} index="01">
                <RichText text={item.summary} className="text-cac-muted" />
              </DetailSection>
            )}

            {item.criteria ? (
              <DetailSection title={t('detail.criteria')} index={nextIndex()}>
                <RichText text={item.criteria} />
              </DetailSection>
            ) : null}

            {attachments.gallery.length ? (
              <GallerySection items={attachments.gallery} index={nextIndex()} />
            ) : null}
            {attachments.documents.length ? (
              <DocumentsSection items={attachments.documents} index={nextIndex()} />
            ) : null}

            <DetailSection title={t('detail.nextSteps')} index={nextIndex()}>
              <p className="text-cac-muted">{t('detail.fundingNextStepsBody')}</p>
              <ul className="mt-4 space-y-2.5 text-pequena text-cac-navy">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cac-green" />
                  {t('detail.pathSolutions')}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cac-green" />
                  {t('detail.pathProjects')}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cac-green" />
                  {t('detail.pathPartners')}
                </li>
              </ul>
            </DetailSection>

            {item.officialUrl ? (
              <DetailSection title={t('detail.officialLink')} index={nextIndex()}>
                <p className="text-cac-muted">{t('detail.officialLinkBody')}</p>
                <a
                  href={item.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-[12px] bg-cac-green2 px-5 py-3 text-pequena font-extrabold text-white transition hover:brightness-105"
                >
                  {t('detail.officialCta')}
                  <span aria-hidden>→</span>
                </a>
              </DetailSection>
            ) : null}
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
              <p className="text-mini font-bold tracking-[1.4px] text-cac-muted uppercase">
                {t('detail.actions')}
              </p>
              <DetailConnectionActions
                connectUrl={connectUrl}
                targetType="FUNDING_OFFER"
                targetId={item.id}
              />
              <DetailFavoriteButton targetType="FUNDING_OFFER" targetId={item.id} />
              <DetailSecondaryButton href={`${urls.web}/funding-offers/new`}>
                {t('funding.publishCta')}
              </DetailSecondaryButton>
              <DetailGuestAuthHint />
            </DetailActionStack>

            <div className="rounded-[16px] border border-dashed border-cac-line bg-[#eff7f3] p-5">
              <p className="text-mini font-bold tracking-[1.4px] text-cac-navy uppercase">
                {t('detail.complementary')}
              </p>
              <p className="mt-2 text-pequena leading-relaxed text-cac-muted">
                {t('detail.fundingComplementaryHint')}
              </p>
              <Link
                to="/funding"
                className="mt-3 inline-flex text-pequena font-bold text-cac-green hover:underline"
              >
                {t('funding.activeTitle')} →
              </Link>
            </div>
          </aside>
        </div>
        {banner.position === 'ABOVE_FOOTER' ? bannerEl : null}
      </CatalogDetailBody>
    </div>
  );
}
