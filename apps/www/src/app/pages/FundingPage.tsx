import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/PageChrome';
import { urls } from '../../config';
import { fundingApi, type FundingOffer, type FunderProfile } from '../api/fundingApi';

export function FundingPage() {
  const { t } = useTranslation();
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
  }, [t]);

  return (
    <PageShell
      eyebrow={t('funding.badge')}
      title={t('funding.title')}
      actions={
        <a
          href={`${urls.web}/funding-offers/new`}
          className="rounded-[10px] bg-cac-green2 px-3.5 py-2.5 text-[11px] font-black text-white"
        >
          {t('funding.publishCta')}
        </a>
      }
    >
      <p className="mb-4 max-w-[760px] text-[12px] leading-relaxed text-cac-muted">{t('funding.support')}</p>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={`rounded-[10px] px-3.5 py-2 text-[11px] font-black ${
            tab === 'active' ? 'bg-cac-green2 text-white' : 'border border-cac-line bg-white text-cac-navy'
          }`}
          onClick={() => setParams({ tab: 'active' })}
        >
          {t('funding.activeTitle')}
        </button>
        <button
          type="button"
          className={`rounded-[10px] px-3.5 py-2 text-[11px] font-black ${
            tab === 'directory' ? 'bg-cac-green2 text-white' : 'border border-cac-line bg-white text-cac-navy'
          }`}
          onClick={() => setParams({ tab: 'directory' })}
        >
          {t('funding.directoryTitle')}
        </button>
      </div>

      {error ? <p className="text-[11px] text-red-700">{error}</p> : null}

      {tab === 'active' ? (
        <div className="space-y-3">
          <p className="text-[11px] text-cac-muted">{t('funding.activeBody')}</p>
          {offers.map((offer) => (
            <article
              key={offer.id}
              className="rounded-[16px] border border-cac-line bg-white p-4 shadow-[0_14px_38px_rgba(10,36,64,.08)]"
            >
              <h2 className="text-[14px] font-black text-cac-navy">{offer.title}</h2>
              <p className="mt-2 text-[11px] text-cac-muted">{offer.summary}</p>
              <p className="mt-2 text-[10px] text-cac-ink">
                {offer.amountRange ? `${offer.amountRange} · ` : ''}
                {offer.deadline ? `${t('funding.deadline')}: ${offer.deadline.slice(0, 10)}` : t('funding.noDeadline')}
              </p>
              {offer.organization ? (
                <p className="mt-1 text-[10px] font-black text-cac-green">{offer.organization.name}</p>
              ) : null}
            </article>
          ))}
          {!offers.length ? <p className="text-[11px] text-cac-muted">{t('detail.emptyList')}</p> : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            {t('funding.directoryWarning')}
          </div>
          <p className="text-[11px] text-cac-muted">{t('funding.directoryBody')}</p>
          {funders.map((funder) => (
            <article key={funder.id} className="rounded-[16px] border border-cac-line bg-white p-4">
              <h2 className="text-[14px] font-black text-cac-navy">{funder.name}</h2>
              <p className="mt-2 text-[11px] text-cac-muted">{funder.summary}</p>
              <p className="mt-1 text-[10px] text-cac-ink">
                {[funder.country, funder.region].filter(Boolean).join(' · ')}
              </p>
            </article>
          ))}
          {!funders.length ? <p className="text-[11px] text-cac-muted">{t('detail.emptyList')}</p> : null}
        </div>
      )}

      <Link to="/search" className="mt-6 inline-block text-[11px] font-black text-cac-green">
        {t('detail.backSearch')}
      </Link>
    </PageShell>
  );
}
