import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@cac/shared';
import { shell } from '../components/PageChrome';
import { urls } from '../../config';
import { fundingApi, type FundingOffer, type FunderProfile } from '../api/fundingApi';
import { resolveMediaUrl } from '../lib/mediaUrl';

const FUNDING_HERO_IMG = '/images/fundo_financiamento.png';

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
      <span className="text-center text-[0.65rem] font-semibold leading-snug text-cac-muted sm:text-mini">
        {label}
      </span>
    </div>
  );
}

export function FundingPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'directory' ? 'directory' : 'active';
  const [offers, setOffers] = useState<FundingOffer[]>([]);
  const [funders, setFunders] = useState<FunderProfile[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fundingApi.listOffers(true), fundingApi.listFunders()])
      .then(([o, f]) => {
        if (cancelled) return;
        setOffers(o.items);
        setFunders(f.items);
      })
      .catch(() => {
        if (!cancelled) setError(t('detail.loadError'));
      });
    return () => {
      cancelled = true;
    };
  }, [t, i18n.language]);

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

        <div className={`${shell} relative grid items-center gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:py-16`}>
          <div className="cac-fade-up min-w-0 max-w-[36rem]">
            <p className="text-mini font-bold tracking-[1.7px] text-cac-green uppercase">
              {t('funding.badge')}
            </p>
            <h1 className="mt-3 text-extra-grande leading-[1.08] font-bold tracking-[-0.7px] text-cac-navy">
              {t('funding.title')}
            </h1>
            <p className="mt-4 text-media leading-relaxed text-cac-muted">{t('funding.support')}</p>
            <div className="mt-7 flex flex-wrap gap-4 sm:gap-5">
              {features.map((f) => (
                <HeroFeature key={f.label} iconClass={f.iconClass} label={f.label} />
              ))}
            </div>
          </div>

          <div className="cac-fade-up-delay relative flex min-h-[11rem] flex-col items-end justify-center gap-5 self-stretch lg:min-h-[16rem] lg:items-end lg:justify-center lg:pr-2">
            <a
              href={`${urls.web}/funding-offers/new`}
              className="inline-flex rounded-full bg-cac-green2 px-6 py-3 text-pequena font-extrabold text-white shadow-[0_14px_32px_rgba(10,36,64,.28)] transition hover:brightness-105"
            >
              {t('funding.publishCta')}
            </a>
            <p
              className="max-w-[17rem] rounded-[12px] bg-[rgba(10,36,64,.55)] px-3.5 py-2.5 text-right text-[1.1rem] leading-snug font-semibold text-white backdrop-blur-[3px] sm:max-w-[19rem] sm:text-[1.2rem]"
              style={{
                fontFamily: '"Caveat", "Segoe Script", "Comic Sans MS", cursive',
                textShadow: '0 1px 2px rgba(0,0,0,.45)',
              }}
            >
              {t('funding.heroQuote')}
              <span className="mt-2 block h-[3px] w-14 ml-auto rounded-full bg-cac-green2" aria-hidden />
            </p>
          </div>
        </div>
      </section>

      <div className={`${shell} py-8 pb-16 md:py-10 md:pb-[4rem]`}>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-[10px] px-3.5 py-2 text-pequena font-bold ${
              tab === 'active' ? 'bg-cac-green2 text-white' : 'border border-cac-line bg-white text-cac-navy'
            }`}
            onClick={() => setParams({ tab: 'active' })}
          >
            {t('funding.activeTitle')}
          </button>
          <button
            type="button"
            className={`rounded-[10px] px-3.5 py-2 text-pequena font-bold ${
              tab === 'directory' ? 'bg-cac-green2 text-white' : 'border border-cac-line bg-white text-cac-navy'
            }`}
            onClick={() => setParams({ tab: 'directory' })}
          >
            {t('funding.directoryTitle')}
          </button>
        </div>

        {error ? <p className="text-pequena text-red-700">{error}</p> : null}

        {tab === 'active' ? (
          <div className="space-y-3">
            <p className="text-pequena text-cac-muted">{t('funding.activeBody')}</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {offers.map((offer) => (
                <Link
                  key={offer.id}
                  to={`/funding/${offer.slug}`}
                  className="flex h-full flex-col overflow-hidden rounded-[16px] border border-cac-line bg-white shadow-[0_14px_38px_rgba(10,36,64,.08)] transition hover:-translate-y-0.5 hover:border-cac-green/40"
                >
                  <div className="h-[120px] bg-gradient-to-br from-[#b8d7bf] to-[#dce9d3]">
                    {resolveMediaUrl(offer.coverImageUrl) ? (
                      <img
                        src={resolveMediaUrl(offer.coverImageUrl)!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="text-media font-bold text-cac-navy">{offer.title}</h2>
                    <p className="mt-2 flex-1 text-pequena leading-relaxed text-cac-muted">{offer.summary}</p>
                    <p className="mt-3 text-mini text-cac-ink">
                      {offer.amountRange ? `${offer.amountRange} · ` : ''}
                      {offer.deadline
                        ? `${t('funding.deadline')}: ${formatDate(offer.deadline, i18n.language)}`
                        : t('funding.noDeadline')}
                    </p>
                    {offer.organization ? (
                      <p className="mt-1 text-mini font-bold text-cac-green">{offer.organization.name}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
            {!offers.length ? <p className="text-pequena text-cac-muted">{t('detail.emptyList')}</p> : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-pequena text-amber-900">
              {t('funding.directoryWarning')}
            </div>
            <p className="text-pequena text-cac-muted">{t('funding.directoryBody')}</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {funders.map((funder) => (
                <article
                  key={funder.id}
                  className="flex h-full flex-col rounded-[16px] border border-cac-line bg-white p-4 shadow-[0_14px_38px_rgba(10,36,64,.08)]"
                >
                  <h2 className="text-media font-bold text-cac-navy">{funder.name}</h2>
                  <p className="mt-2 flex-1 text-pequena leading-relaxed text-cac-muted">{funder.summary}</p>
                  <p className="mt-3 text-mini text-cac-ink">
                    {[funder.country, funder.region].filter(Boolean).join(' · ')}
                  </p>
                </article>
              ))}
            </div>
            {!funders.length ? <p className="text-pequena text-cac-muted">{t('detail.emptyList')}</p> : null}
          </div>
        )}

        <Link to="/search" className="mt-6 inline-block text-pequena font-bold text-cac-green">
          {t('detail.backSearch')}
        </Link>
      </div>
    </div>
  );
}
