import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalogApi, type Challenge } from '../api/catalogApi';
import {
  CatalogDetailBody,
  CatalogDetailHero,
  DetailHeroChip,
  DetailMetaChip,
  DetailOrgCard,
  DetailPrimaryButton,
  DetailSection,
} from '../components/CatalogDetail';
import { BackToSearchLink } from '../components/BackToSearchLink';
import { shell } from '../components/PageChrome';
import { urls } from '../../config';

export function ChallengeDetailPage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const [item, setItem] = useState<Challenge | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void catalogApi
      .getChallenge(slug)
      .then((res) => {
        if (!cancelled) setItem(res.challenge);
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
        <h1 className="text-grande font-bold text-cac-navy">{t('detail.notFound')}</h1>
        <div className="mt-4">
          <BackToSearchLink className="inline-flex items-center gap-2 rounded-[10px] border border-cac-line bg-white px-3.5 py-2.5 text-pequena font-bold text-cac-navy" />
        </div>
      </div>
    );
  }
  if (!item) return <div className={`${shell} py-10 text-cac-muted`}>{t('detail.loading')}</div>;

  return (
    <div className="bg-cac-bg">
      <CatalogDetailHero
        eyebrow={t('detail.challengeBadge')}
        title={item.title}
        summary={item.summary}
        chips={
          <>
            <DetailHeroChip>{item.needType}</DetailHeroChip>
            {item.country ? <DetailHeroChip>{item.country}</DetailHeroChip> : null}
            {item.region ? <DetailHeroChip>{item.region}</DetailHeroChip> : null}
          </>
        }
      />
      <CatalogDetailBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.7fr)] lg:gap-8">
          <article className="cac-fade-up rounded-[18px] border border-cac-line bg-white px-5 py-2 shadow-[0_16px_40px_rgba(10,36,64,.07)] md:px-8">
            {item.context ? (
              <DetailSection title={t('detail.context')} index="01">
                <p>{item.context}</p>
              </DetailSection>
            ) : null}
            {item.tags.length ? (
              <DetailSection title={t('detail.topics')} index="02">
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <DetailMetaChip key={tag}>{tag}</DetailMetaChip>
                  ))}
                </div>
              </DetailSection>
            ) : null}
          </article>
          <aside className="cac-fade-up-delay space-y-4">
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
            <div className="rounded-[16px] border border-cac-line bg-white p-5 shadow-[0_10px_28px_rgba(10,36,64,.06)]">
              <DetailPrimaryButton href={`${urls.web}/catalog/challenges/new`}>
                {t('home.path03')}
              </DetailPrimaryButton>
              <Link
                to={item.organization ? `/organizations/${item.organization.slug}` : '/search'}
                className="mt-3 flex w-full items-center justify-center rounded-[12px] border border-cac-line bg-[#f7faf8] px-4 py-3 text-pequena font-bold text-cac-navy"
              >
                {t('detail.organization')}
              </Link>
            </div>
          </aside>
        </div>
      </CatalogDetailBody>
    </div>
  );
}
