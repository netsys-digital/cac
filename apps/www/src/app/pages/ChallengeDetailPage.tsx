import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalogApi, type Challenge } from '../api/catalogApi';
import { Chip, PageShell, shell } from '../components/PageChrome';
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

  if (error) return <PageShell title={t('detail.notFound')} />;
  if (!item) return <div className={`${shell} py-10 text-cac-muted`}>{t('detail.loading')}</div>;

  return (
    <PageShell eyebrow={t('detail.challengeBadge')} title={item.title}>
      <article className="rounded-[16px] border border-cac-line bg-white p-4 shadow-[0_14px_38px_rgba(10,36,64,.10)]">
        <p className="text-[11px] leading-relaxed text-cac-muted">{item.summary}</p>
        {item.context ? (
          <>
            <h2 className="mt-5 text-[14px] font-black text-cac-navy">{t('detail.context')}</h2>
            <p className="mt-2 text-[11px] leading-relaxed text-cac-muted">{item.context}</p>
          </>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Chip>{item.needType}</Chip>
          {item.country ? <Chip>{item.country}</Chip> : null}
          {item.tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
        {item.organization ? (
          <Link
            to={`/organizations/${item.organization.slug}`}
            className="mt-5 block text-[11px] font-black text-cac-green"
          >
            {item.organization.name}
          </Link>
        ) : null}
        <a
          href={`${urls.web}/catalog/challenges/new`}
          className="mt-5 inline-flex rounded-[10px] bg-cac-green2 px-3.5 py-2.5 text-[11px] font-black text-white"
        >
          {t('home.path03')}
        </a>
      </article>
    </PageShell>
  );
}
