import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalogApi, type Technology } from '../api/catalogApi';
import { Chip, DetailPhoto, PageShell, shell } from '../components/PageChrome';
import { urls } from '../../config';

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
      <PageShell title={t('detail.notFound')}>
        <Link to="/search" className="text-[11px] font-black text-cac-green">
          {t('detail.backSearch')}
        </Link>
      </PageShell>
    );
  }

  if (!item) {
    return (
      <div className={`${shell} py-10 text-cac-muted`}>{t('detail.loading')}</div>
    );
  }

  return (
    <PageShell
      eyebrow={t('detail.solutionBadge')}
      title={item.title}
      actions={
        <Link
          to="/search"
          className="rounded-[10px] border border-cac-line bg-white px-3.5 py-2.5 text-[11px] font-black text-cac-navy"
        >
          {t('detail.backSearch')}
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-[16px] border border-cac-line bg-white p-4 shadow-[0_14px_38px_rgba(10,36,64,.10)]">
          <DetailPhoto />
          <p className="mt-3 text-[11px] leading-relaxed text-cac-muted">{item.summary}</p>
          <h2 className="mt-5 text-[14px] font-black text-cac-navy">{t('detail.problem')}</h2>
          <p className="mt-2 text-[11px] leading-relaxed text-cac-muted">{item.problemStatement}</p>
          <h2 className="mt-5 text-[14px] font-black text-cac-navy">{t('detail.how')}</h2>
          <p className="mt-2 text-[11px] leading-relaxed text-cac-muted">{item.howItWorks}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Chip>{item.country}</Chip>
            {item.climateAction ? <Chip>{item.climateAction}</Chip> : null}
            {item.maturity ? <Chip>{item.maturity}</Chip> : null}
            {item.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`${urls.web}/login?returnUrl=${encodeURIComponent(`/connections/new?targetType=TECHNOLOGY&targetId=${item.id}`)}`}
              className="rounded-[10px] bg-cac-green2 px-3.5 py-2.5 text-[11px] font-black text-white"
            >
              {t('detail.interest')}
            </a>
            <a
              href={`${urls.web}/login?returnUrl=${encodeURIComponent(`/connections/new?targetType=TECHNOLOGY&targetId=${item.id}`)}`}
              className="rounded-[10px] border border-cac-green bg-white px-3.5 py-2.5 text-[11px] font-black text-cac-green"
            >
              {t('detail.connect')}
            </a>
            <a
              href={`${urls.web}/login?returnUrl=${encodeURIComponent(`/connections/new?targetType=TECHNOLOGY&targetId=${item.id}&intent=save`)}`}
              className="rounded-[10px] border border-cac-line bg-white px-3.5 py-2.5 text-[11px] font-black text-cac-navy"
            >
              {t('detail.favorite')}
            </a>
            <a
              href={`${urls.web}/catalog/challenges/new`}
              className="rounded-[10px] border border-cac-line bg-white px-3.5 py-2.5 text-[11px] font-black text-cac-navy"
            >
              {t('home.path03')}
            </a>
          </div>
        </article>

        <aside className="space-y-3">
          {item.organization ? (
            <Link
              to={`/organizations/${item.organization.slug}`}
              className="block rounded-[16px] border border-cac-line bg-white p-4 shadow-[0_14px_38px_rgba(10,36,64,.10)]"
            >
              <p className="text-[10px] font-black tracking-wide text-cac-green uppercase">
                {t('detail.organization')}
              </p>
              <h3 className="mt-1 text-[14px] font-black text-cac-navy">{item.organization.name}</h3>
              <p className="mt-2 text-[10px] text-cac-muted">{item.organization.summary}</p>
            </Link>
          ) : null}
          <div className="rounded-[16px] border border-cac-line bg-[#eff7f3] p-4">
            <p className="text-[10px] font-black text-cac-navy uppercase">{t('detail.complementary')}</p>
            <ul className="mt-3 space-y-2 text-[10px] leading-snug text-cac-muted">
              <li>{t('detail.pathImpl')}</li>
              <li>{t('detail.pathProjects')}</li>
              <li>{t('detail.pathFunding')}</li>
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
