import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalogApi, type Project } from '../api/catalogApi';
import { Chip, PageShell, shell } from '../components/PageChrome';

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

  if (error) return <PageShell title={t('detail.notFound')} />;
  if (!item) return <div className={`${shell} py-10 text-cac-muted`}>{t('detail.loading')}</div>;

  return (
    <PageShell eyebrow={t('detail.projectBadge')} title={item.title}>
      <article className="rounded-[16px] border border-cac-line bg-white p-4 shadow-[0_14px_38px_rgba(10,36,64,.10)]">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Chip>{item.type}</Chip>
          {item.country ? <Chip>{item.country}</Chip> : null}
        </div>
        <p className="text-[11px] leading-relaxed text-cac-muted">{item.summary}</p>
        {item.organization ? (
          <Link
            to={`/organizations/${item.organization.slug}`}
            className="mt-5 block text-[11px] font-black text-cac-green"
          >
            {item.organization.name}
          </Link>
        ) : null}
      </article>
    </PageShell>
  );
}
