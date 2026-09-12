import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@cac/shared';
import { PageShell } from '../components/PageChrome';
import { urls } from '../../config';
import { fundingApi, type FundingOffer, type FunderProfile } from '../api/fundingApi';
import { resolveMediaUrl } from '../lib/mediaUrl';

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

  return (
    <PageShell
      eyebrow={t('funding.badge')}
      title={t('funding.title')}
      actions={
        <a
          href={`${urls.web}/funding-offers/new`}
          className="rounded-[10px] bg-cac-green2 px-3.5 py-2.5 text-pequena font-bold text-white"
        >
          {t('funding.publishCta')}
        </a>
      }
    >
      <p className="mb-4 max-w-[760px] text-media leading-relaxed text-cac-muted">{t('funding.support')}</p>

      <div className="mb-4 flex gap-2">
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
    </PageShell>
  );
}
