import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalogApi, type Project } from '../api/catalogApi';
import {
  CatalogDetailBody,
  CatalogDetailHero,
  DetailHeroChip,
  DetailOrgCard,
  DetailSection,
} from '../components/CatalogDetail';
import { BackToSearchLink } from '../components/BackToSearchLink';
import { shell } from '../components/PageChrome';
import { resolveMediaUrl } from '../lib/mediaUrl';

export function ProjectDetailPage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const [item, setItem] = useState<Project | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void catalogApi
      .getProject(slug)
      .then((res) => {
        if (!cancelled) setItem(res.project);
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
  if (!item) return <div className={`${shell} py-10 text-cac-muted`}>{t('detail.loading')}</div>;

  return (
    <div className="bg-cac-bg">
      <CatalogDetailHero
        eyebrow={t('detail.projectBadge')}
        title={item.title}
        summary={item.summary}
        coverImageUrl={resolveMediaUrl(item.coverImageUrl)}
        chips={
          <>
            <DetailHeroChip>{item.type}</DetailHeroChip>
            {item.country ? <DetailHeroChip>{item.country}</DetailHeroChip> : null}
            {item.region ? <DetailHeroChip>{item.region}</DetailHeroChip> : null}
          </>
        }
      />
      <CatalogDetailBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.7fr)] lg:gap-8">
          <article className="cac-fade-up rounded-[18px] border border-cac-line bg-white px-5 py-6 shadow-[0_16px_40px_rgba(10,36,64,.07)] md:px-8">
            <DetailSection title={t('detail.context')} index="01">
              <p>{item.summary}</p>
            </DetailSection>
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
          </aside>
        </div>
      </CatalogDetailBody>
    </div>
  );
}
