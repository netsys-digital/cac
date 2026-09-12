import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalogApi, type OrgSummary, type Technology } from '../api/catalogApi';
import { Chip, PageShell, ResultCard, shell } from '../components/PageChrome';
import { OrgLogo } from '../components/CatalogDetail';
import { resolveMediaUrl } from '../lib/mediaUrl';

export function OrganizationPage() {
  const { slug = '' } = useParams();
  const { t, i18n } = useTranslation();
  const [org, setOrg] = useState<OrgSummary | null>(null);
  const [techs, setTechs] = useState<Technology[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    void Promise.all([catalogApi.getOrganization(slug), catalogApi.listTechnologies()])
      .then(([orgRes, techRes]) => {
        if (cancelled) return;
        setOrg(orgRes.organization);
        setTechs(techRes.items.filter((item) => item.organization?.slug === slug));
      })
      .catch(() => {
        if (!cancelled) setError(t('detail.notFound'));
      });
    return () => {
      cancelled = true;
    };
  }, [slug, t, i18n.language]);

  if (error) {
    return <PageShell title={t('detail.notFound')} />;
  }
  if (!org) {
    return <div className={`${shell} py-10 text-cac-muted`}>{t('detail.loading')}</div>;
  }

  return (
    <PageShell
      eyebrow={org.verificationStatus === 'VERIFIED' ? t('detail.verified') : t('detail.organization')}
      title={org.name}
    >
      <div className="mb-6 rounded-[16px] border border-cac-line bg-white p-5 shadow-[0_14px_38px_rgba(10,36,64,.10)]">
        <div className="flex items-start gap-4">
          <OrgLogo name={org.name} logoUrl={org.logoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-media leading-relaxed text-cac-muted">{org.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {org.country ? <Chip>{org.country}</Chip> : null}
              {org.region ? <Chip>{org.region}</Chip> : null}
              {org.website ? (
                <a href={org.website} className="text-mini font-bold text-cac-green" target="_blank" rel="noreferrer">
                  {org.website}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <h2 className="mb-3 text-grande font-bold text-cac-navy">{t('detail.orgSolutions')}</h2>
      <div className="space-y-2">
        {techs.map((tech) => (
          <ResultCard
            key={tech.id}
            to={`/solutions/${tech.slug}`}
            title={tech.title}
            meta={tech.summary}
            tags={tech.tags}
            imageUrl={resolveMediaUrl(tech.coverImageUrl)}
          />
        ))}
        {!techs.length ? <p className="text-pequena text-cac-muted">{t('detail.emptyList')}</p> : null}
      </div>
      <Link to="/search" className="mt-6 inline-block text-pequena font-bold text-cac-green">
        {t('detail.backSearch')}
      </Link>
    </PageShell>
  );
}
