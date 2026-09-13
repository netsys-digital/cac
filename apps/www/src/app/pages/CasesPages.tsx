import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Chip, shell } from '../components/PageChrome';
import {
  CatalogDetailBody,
  CatalogDetailBanner,
  CatalogDetailHero,
  DetailActionStack,
  DetailHeroChip,
  DetailMetaChip,
  DetailOrgCard,
  DetailSecondaryButton,
  DetailFavoriteButton,
  DetailSection,
} from '../components/CatalogDetail';
import { DetailConnectionActions } from '../components/DetailConnectionActions';
import { DetailGuestAuthHint } from '../components/DetailGuestAuthHint';
import { BackToSearchLink } from '../components/BackToSearchLink';
import { urls } from '../../config';
import { casesApi, type SuccessCase } from '../api/casesApi';
import { needTypeLabel } from '../lib/needTypeLabel';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { resolveDetailBanner } from '../lib/detailBanner';

const CASES_HERO_IMG = '/images/fundo_casos.png';

export function CasesPage() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<SuccessCase[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void casesApi
      .list()
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch(() => {
        if (!cancelled) setError(t('detail.loadError'));
      });
    return () => {
      cancelled = true;
    };
  }, [t, i18n.language]);

  return (
    <div className="bg-cac-bg">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[#f4f8f9] bg-cover bg-[position:center_center] bg-no-repeat"
          style={{ backgroundImage: `url(${CASES_HERO_IMG})` }}
          aria-hidden
        />

        <div
          className={`${shell} relative grid items-center gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:py-16`}
        >
          <div className="cac-fade-up min-w-0 max-w-[36rem]">
            <p className="text-mini font-bold tracking-[1.7px] text-cac-green uppercase">
              {t('cases.badge')}
            </p>
            <h1 className="mt-3 text-extra-grande leading-[1.08] font-bold tracking-[-0.7px] text-cac-navy">
              {t('cases.title')}
            </h1>
            <p className="mt-4 text-media leading-relaxed text-cac-muted">{t('cases.support')}</p>
            <a
              href={`${urls.web}/cases/new`}
              className="mt-7 inline-flex rounded-full bg-cac-green2 px-6 py-3 text-pequena font-extrabold text-white shadow-[0_14px_32px_rgba(10,36,64,.28)] transition hover:brightness-105"
            >
              {t('cases.publishCta')}
            </a>
          </div>

          <div className="pointer-events-none relative min-h-[10rem] self-stretch lg:min-h-[16rem]" aria-hidden />
        </div>
      </section>

      <div className={`${shell} py-8 pb-16 md:py-10 md:pb-[4rem]`}>
        {error ? <p className="text-pequena text-red-700">{error}</p> : null}
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/cases/${item.slug}`}
              className="rounded-[16px] border border-cac-line bg-white p-4 shadow-[0_14px_38px_rgba(10,36,64,.08)] transition hover:-translate-y-0.5"
            >
              <div className="h-[120px] overflow-hidden rounded-[12px] bg-gradient-to-br from-[#b8d7bf] to-[#dce9d3]">
                {resolveMediaUrl(item.coverImageUrl) ||
                item.media.find((m) => m.kind === 'IMAGE' || m.mimeType?.startsWith('image/')) ? (
                  <img
                    src={
                      resolveMediaUrl(item.coverImageUrl) ||
                      resolveMediaUrl(
                        item.media.find((m) => m.kind === 'IMAGE' || m.mimeType?.startsWith('image/'))!.url,
                      )!
                    }
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <h2 className="mt-3 text-media font-bold text-cac-navy">{item.title}</h2>
              <p className="mt-2 text-pequena leading-relaxed text-cac-muted">{item.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Chip>{item.country}</Chip>
                {item.needs.slice(0, 3).map((n) => (
                  <Chip key={n.id}>{needTypeLabel(n.needType, t)}</Chip>
                ))}
              </div>
            </Link>
          ))}
        </div>
        {!items.length && !error ? <p className="text-pequena text-cac-muted">{t('detail.emptyList')}</p> : null}
      </div>
    </div>
  );
}

export function CaseDetailPage() {
  const { slug = '' } = useParams();
  const { t, i18n } = useTranslation();
  const [item, setItem] = useState<SuccessCase | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    setItem(null);
    void casesApi
      .get(slug)
      .then((res) => {
        if (!cancelled) setItem(res.successCase);
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
          <BackToSearchLink className="inline-flex items-center gap-2 rounded-[10px] border border-cac-line bg-white px-3.5 py-2.5 text-pequena font-bold text-cac-navy" />
        </div>
      </div>
    );
  }

  if (!item) {
    return <div className={`${shell} py-10 text-cac-muted`}>{t('detail.loading')}</div>;
  }

  const connectUrl = `${urls.web}/login?returnUrl=${encodeURIComponent(`/connections/new?targetType=SUCCESS_CASE&targetId=${item.id}`)}`;
  const imageMedia = item.media.filter((m) => m.kind === 'IMAGE' || m.mimeType?.startsWith('image/'));
  const otherMedia = item.media.filter((m) => !(m.kind === 'IMAGE' || m.mimeType?.startsWith('image/')));
  const hasEvidence = imageMedia.length > 0 || otherMedia.length > 0;
  const banner = resolveDetailBanner(item, item.organization, 'SUCCESS_CASE');
  const bannerEl = (
    <CatalogDetailBanner
      bannerUrl={banner.url}
      linkUrl={banner.linkUrl}
      position={banner.position}
    />
  );

  let section = 0;
  const nextIndex = () => String(++section).padStart(2, '0');

  return (
    <div className="bg-cac-bg">
      <CatalogDetailHero
        eyebrow={t('detail.caseBadge')}
        title={item.title}
        summary={item.summary}
        coverImageUrl={resolveMediaUrl(item.coverImageUrl)}
        topBanner={banner.position === 'ABOVE_HERO' ? bannerEl : undefined}
        chips={
          <>
            <DetailHeroChip>{item.country}</DetailHeroChip>
            {item.region ? <DetailHeroChip>{item.region}</DetailHeroChip> : null}
            {item.needs.slice(0, 3).map((n) => (
              <DetailHeroChip key={n.id}>{needTypeLabel(n.needType, t)}</DetailHeroChip>
            ))}
          </>
        }
      />
      {banner.position === 'BELOW_HERO' ? bannerEl : null}

      <CatalogDetailBody pullUp={banner.position !== 'BELOW_HERO'}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.7fr)] lg:gap-8">
          <article className="cac-fade-up rounded-[18px] border border-cac-line bg-white px-5 py-2 shadow-[0_16px_40px_rgba(10,36,64,.07)] md:px-8">
            <DetailSection title={t('cases.context')} index={nextIndex()}>
              <p className={item.context ? undefined : 'text-cac-muted'}>{item.context || item.summary}</p>
            </DetailSection>

            {item.outcomes ? (
              <DetailSection title={t('cases.outcomes')} index={nextIndex()}>
                <p>{item.outcomes}</p>
              </DetailSection>
            ) : null}

            {item.needs.length ? (
              <DetailSection title={t('cases.needs')} index={nextIndex()}>
                <div className="flex flex-wrap gap-1.5">
                  {item.needs.map((n) => (
                    <DetailMetaChip key={n.id}>
                      {needTypeLabel(n.needType, t)}
                      {n.detail ? `: ${n.detail}` : ''}
                    </DetailMetaChip>
                  ))}
                </div>
              </DetailSection>
            ) : null}

            {hasEvidence ? (
              <DetailSection title={t('cases.evidence')} index={nextIndex()}>
                {imageMedia.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {imageMedia.map((m) => (
                      <figure key={m.id} className="overflow-hidden rounded-[12px] border border-cac-line">
                        <img src={m.url} alt={m.caption || m.filename} className="h-40 w-full object-cover" />
                        {m.caption ? (
                          <figcaption className="px-2.5 py-2 text-mini text-cac-muted">{m.caption}</figcaption>
                        ) : null}
                      </figure>
                    ))}
                  </div>
                ) : null}
                {otherMedia.length ? (
                  <ul className={`${imageMedia.length ? 'mt-4' : ''} space-y-2`}>
                    {otherMedia.map((m) => (
                      <li key={m.id}>
                        {m.url.startsWith('http') ? (
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-pequena font-bold text-cac-green hover:underline"
                          >
                            {m.caption || m.filename}
                          </a>
                        ) : (
                          <span className="text-pequena text-cac-muted">{m.caption || m.filename}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </DetailSection>
            ) : null}

            <DetailSection title={t('detail.nextSteps')} index={nextIndex()}>
              <p className="text-cac-muted">{t('detail.caseNextStepsBody')}</p>
              <ul className="mt-4 space-y-2.5 text-pequena text-cac-navy">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cac-green" />
                  {t('detail.pathSolutions')}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cac-green" />
                  {t('detail.pathPartners')}
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
              <DetailConnectionActions
                connectUrl={connectUrl}
                targetType="SUCCESS_CASE"
                targetId={item.id}
              />
              <DetailFavoriteButton targetType="SUCCESS_CASE" targetId={item.id} />
              <DetailSecondaryButton href={`${urls.web}/cases/new`}>
                {t('cases.publishCta')}
              </DetailSecondaryButton>
              <DetailGuestAuthHint />
            </DetailActionStack>

            <div className="rounded-[16px] border border-dashed border-cac-line bg-[#eff7f3] p-5">
              <p className="text-mini font-bold tracking-[1.4px] text-cac-navy uppercase">
                {t('detail.complementary')}
              </p>
              <p className="mt-2 text-pequena leading-relaxed text-cac-muted">
                {t('detail.caseComplementaryHint')}
              </p>
              <Link
                to="/cases"
                className="mt-3 inline-flex text-pequena font-bold text-cac-green hover:underline"
              >
                {t('cases.back')} →
              </Link>
            </div>
          </aside>
        </div>
        {banner.position === 'ABOVE_FOOTER' ? bannerEl : null}
      </CatalogDetailBody>
    </div>
  );
}
