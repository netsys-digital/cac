import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@cac/shared';
import { fundingApi, type FundingOffer } from '../api/fundingApi';
import {
  CatalogDetailBody,
  CatalogDetailHero,
  DetailActionStack,
  DetailHeroStatCard,
  DetailHeroStatGrid,
  DetailOrgCard,
  DetailPrimaryButton,
  DetailSecondaryButton,
  DetailSection,
} from '../components/CatalogDetail';
import { BackToSearchLink } from '../components/BackToSearchLink';
import { shell } from '../components/PageChrome';
import { urls } from '../../config';

export function FundingOfferDetailPage() {
  const { slug = '' } = useParams();
  const { t, i18n } = useTranslation();
  const [item, setItem] = useState<FundingOffer | null>(null);
  const [error, setError] = useState('');

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
  }, [slug, t]);

  if (error) {
    return (
      <div className={`${shell} py-12`}>
        <h1 className="text-extra-grande font-bold text-cac-navy">{t('detail.notFound')}</h1>
        <div className="mt-4">
          <BackToSearchLink className="inline-flex items-center gap-2 rounded-[10px] border border-cac-line bg-white px-3.5 py-2.5 text-pequena font-bold text-cac-navy" />
        </div>
      </div>
    );
  }

  if (!item) {
    return <div className={`${shell} py-10 text-cac-muted`}>{t('detail.loading')}</div>;
  }

  const deadlineLabel = item.deadline ? formatDate(item.deadline, i18n.language) : null;
  const connectUrl = `${urls.web}/login?returnUrl=${encodeURIComponent(`/connections/new?targetType=FUNDING_OFFER&targetId=${item.id}`)}`;
  const favoriteUrl = `${urls.web}/login?returnUrl=${encodeURIComponent(`/connections/new?targetType=FUNDING_OFFER&targetId=${item.id}&intent=save`)}`;

  const conditionCards = [
    item.amountRange
      ? { label: t('detail.amountRange'), value: item.amountRange }
      : null,
    {
      label: t('funding.deadline'),
      value: deadlineLabel ?? t('funding.noDeadline'),
    },
    item.country
      ? { label: t('search.filters.country'), value: item.country }
      : null,
    item.region
      ? { label: t('search.filters.region'), value: item.region }
      : null,
  ].filter((c): c is { label: string; value: string } => Boolean(c));

  return (
    <div className="bg-cac-bg">
      <CatalogDetailHero
        eyebrow={t('detail.fundingBadge')}
        title={item.title}
        summary={item.summary}
        aside={
          conditionCards.length > 0 ? (
            <DetailHeroStatGrid>
              {conditionCards.map((card) => (
                <DetailHeroStatCard key={card.label} label={card.label} value={card.value} />
              ))}
            </DetailHeroStatGrid>
          ) : undefined
        }
      />

      <CatalogDetailBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.7fr)] lg:gap-8">
          <article className="cac-fade-up rounded-[18px] border border-cac-line bg-white px-5 py-2 shadow-[0_16px_40px_rgba(10,36,64,.07)] md:px-8">
            {item.whatFunds ? (
              <DetailSection title={t('detail.whatFunds')} index="01">
                <p>{item.whatFunds}</p>
              </DetailSection>
            ) : (
              <DetailSection title={t('detail.whatFunds')} index="01">
                <p className="text-cac-muted">{item.summary}</p>
              </DetailSection>
            )}

            {item.criteria ? (
              <DetailSection title={t('detail.criteria')} index="02">
                <p>{item.criteria}</p>
              </DetailSection>
            ) : null}

            <DetailSection title={t('detail.nextSteps')} index="03">
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
          </article>

          <aside className="cac-fade-up-delay-2 space-y-4">
            {item.organization ? (
              <DetailOrgCard
                to={`/organizations/${item.organization.slug}`}
                name={item.organization.name}
                summary={item.organization.summary}
                label={t('detail.organization')}
                verifiedLabel={t('detail.verified')}
                verified={item.organization.verificationStatus === 'VERIFIED'}
              />
            ) : null}

            <DetailActionStack>
              <p className="text-mini font-bold tracking-[1.4px] text-cac-muted uppercase">
                {t('detail.actions')}
              </p>
              <DetailPrimaryButton href={connectUrl}>{t('detail.interest')}</DetailPrimaryButton>
              <DetailSecondaryButton href={connectUrl}>{t('detail.connect')}</DetailSecondaryButton>
              <DetailSecondaryButton href={favoriteUrl}>{t('detail.favorite')}</DetailSecondaryButton>
              {item.officialUrl ? (
                <a
                  href={item.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center rounded-[12px] border border-cac-line bg-[#f7faf8] px-4 py-3 text-pequena font-bold text-cac-navy transition hover:border-cac-green/40 hover:bg-white"
                >
                  {t('detail.officialLink')}
                </a>
              ) : null}
              <DetailSecondaryButton href={`${urls.web}/funding-offers/new`}>
                {t('funding.publishCta')}
              </DetailSecondaryButton>
              <p className="pt-1 text-pequena leading-snug text-cac-muted">{t('detail.actionsHint')}</p>
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
      </CatalogDetailBody>
    </div>
  );
}
