import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalogApi, type Technology } from '../api/catalogApi';
import {
  CatalogDetailBody,
  CatalogDetailHero,
  DetailActionStack,
  DetailHeroChip,
  DetailMetaChip,
  DetailOrgCard,
  DetailPrimaryButton,
  DetailSecondaryButton,
  DetailSection,
} from '../components/CatalogDetail';
import { BackToSearchLink } from '../components/BackToSearchLink';
import { shell } from '../components/PageChrome';
import { urls } from '../../config';
import { resolveMediaUrl } from '../lib/mediaUrl';

function labelOrRaw(value: string | null | undefined, map: Record<string, string>) {
  if (!value) return null;
  return map[value] ?? value.replace(/_/g, ' ');
}

export function TechnologyDetailPage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const [item, setItem] = useState<Technology | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    setItem(null);
    void catalogApi
      .getTechnology(slug)
      .then((res) => {
        if (!cancelled) setItem(res.technology);
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

  const climate = labelOrRaw(item.climateAction, {
    ADAPTATION: t('detail.climate.adaptation'),
    MITIGATION: t('detail.climate.mitigation'),
    BOTH: t('detail.climate.both'),
  });
  const maturity = labelOrRaw(item.maturity, {
    RESEARCH: t('detail.maturity.research'),
    VALIDATION: t('detail.maturity.validation'),
    DEMONSTRATION: t('detail.maturity.demonstration'),
    READY_FOR_IMPLEMENTATION: t('detail.maturity.ready'),
    AT_SCALE: t('detail.maturity.scale'),
  });

  const connectUrl = `${urls.web}/login?returnUrl=${encodeURIComponent(`/connections/new?targetType=TECHNOLOGY&targetId=${item.id}`)}`;
  const favoriteUrl = `${urls.web}/login?returnUrl=${encodeURIComponent(`/connections/new?targetType=TECHNOLOGY&targetId=${item.id}&intent=save`)}`;

  const relatedVideoRaw =
    item.videoUrl ||
    item.media?.find((m) => m.kind === 'VIDEO' || m.mimeType?.startsWith('video/'))?.url ||
    null;
  const relatedVideo = resolveMediaUrl(relatedVideoRaw) ?? relatedVideoRaw;

  return (
    <div className="bg-cac-bg">
      <CatalogDetailHero
        eyebrow={t('detail.solutionBadge')}
        title={item.title}
        summary={item.summary}
        videoUrl={relatedVideo}
        coverImageUrl={resolveMediaUrl(item.coverImageUrl)}
        chips={
          <>
            {item.country ? <DetailHeroChip>{item.country}</DetailHeroChip> : null}
            {item.region ? <DetailHeroChip>{item.region}</DetailHeroChip> : null}
            {climate ? <DetailHeroChip>{climate}</DetailHeroChip> : null}
            {maturity ? <DetailHeroChip>{maturity}</DetailHeroChip> : null}
          </>
        }
      />

      <CatalogDetailBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.7fr)] lg:gap-8">
          <article className="cac-fade-up rounded-[18px] border border-cac-line bg-white px-5 py-2 shadow-[0_16px_40px_rgba(10,36,64,.07)] md:px-8">
            <DetailSection title={t('detail.problem')} index="01">
              <p>{item.problemStatement}</p>
            </DetailSection>

            <DetailSection title={t('detail.how')} index="02">
              <p>{item.howItWorks}</p>
            </DetailSection>

            {item.tags.length ? (
              <DetailSection title={t('detail.topics')} index="03">
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <DetailMetaChip key={tag}>{tag}</DetailMetaChip>
                  ))}
                </div>
              </DetailSection>
            ) : null}

            <DetailSection title={t('detail.nextSteps')} index="04">
              <p className="text-cac-muted">{t('detail.nextStepsBody')}</p>
              <ul className="mt-4 space-y-2.5 text-pequena text-cac-navy">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cac-green" />
                  {t('detail.pathImpl')}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cac-green" />
                  {t('detail.pathProjects')}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cac-green" />
                  {t('detail.pathFunding')}
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
              <DetailPrimaryButton href={connectUrl}>{t('detail.interest')}</DetailPrimaryButton>
              <DetailSecondaryButton href={connectUrl}>{t('detail.connect')}</DetailSecondaryButton>
              <DetailSecondaryButton href={favoriteUrl}>{t('detail.favorite')}</DetailSecondaryButton>
              <DetailSecondaryButton href={`${urls.web}/catalog/challenges/new`}>
                {t('home.path03')}
              </DetailSecondaryButton>
              <p className="pt-1 text-pequena leading-snug text-cac-muted">{t('detail.actionsHint')}</p>
            </DetailActionStack>

            <div className="rounded-[16px] border border-dashed border-cac-line bg-[#eff7f3] p-5">
              <p className="text-mini font-bold tracking-[1.4px] text-cac-navy uppercase">
                {t('detail.complementary')}
              </p>
              <p className="mt-2 text-pequena leading-relaxed text-cac-muted">
                {t('detail.complementaryHint')}
              </p>
              <Link
                to="/funding"
                className="mt-3 inline-flex text-pequena font-bold text-cac-green hover:underline"
              >
                {t('detail.pathFunding')} →
              </Link>
            </div>
          </aside>
        </div>
      </CatalogDetailBody>
    </div>
  );
}
