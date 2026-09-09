import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Chip, PageShell, shell } from '../components/PageChrome';
import { urls } from '../../config';
import { casesApi, type SuccessCase } from '../api/casesApi';

export function CasesPage() {
  const { t } = useTranslation();
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
  }, [t]);

  return (
    <PageShell
      eyebrow={t('cases.badge')}
      title={t('cases.title')}
      actions={
        <a
          href={`${urls.web}/cases/new`}
          className="rounded-[10px] bg-cac-green2 px-3.5 py-2.5 text-pequena font-bold text-white"
        >
          {t('cases.publishCta')}
        </a>
      }
    >
      <p className="mb-4 max-w-[760px] text-pequena leading-relaxed text-cac-muted">{t('cases.support')}</p>
      {error ? <p className="text-pequena text-red-700">{error}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/cases/${item.slug}`}
            className="rounded-[16px] border border-cac-line bg-white p-4 shadow-[0_14px_38px_rgba(10,36,64,.08)] transition hover:-translate-y-0.5"
          >
            <div className="h-[120px] rounded-[12px] bg-gradient-to-br from-[#b8d7bf] to-[#dce9d3]" />
            <h2 className="mt-3 text-media font-bold text-cac-navy">{item.title}</h2>
            <p className="mt-2 text-mini leading-relaxed text-cac-muted">{item.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Chip>{item.country}</Chip>
              {item.needs.slice(0, 3).map((n) => (
                <Chip key={n.id}>{n.needType}</Chip>
              ))}
            </div>
          </Link>
        ))}
      </div>
      {!items.length && !error ? <p className="text-pequena text-cac-muted">{t('detail.emptyList')}</p> : null}
    </PageShell>
  );
}

export function CaseDetailPage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const [item, setItem] = useState<SuccessCase | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
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
  }, [slug, t]);

  if (error) return <PageShell title={t('detail.notFound')} />;
  if (!item) return <div className={`${shell} py-10 text-cac-muted`}>{t('detail.loading')}</div>;

  return (
    <PageShell eyebrow={t('cases.badge')} title={item.title}>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-[16px] border border-cac-line bg-white p-4">
          <div className="h-[180px] rounded-[12px] bg-gradient-to-br from-[#b8d7bf] to-[#dce9d3]" />
          <p className="mt-4 text-pequena leading-relaxed text-cac-muted">{item.summary}</p>
          {item.context ? (
            <>
              <h2 className="mt-5 text-media font-bold text-cac-navy">{t('cases.context')}</h2>
              <p className="mt-2 text-pequena text-cac-muted">{item.context}</p>
            </>
          ) : null}
          {item.outcomes ? (
            <>
              <h2 className="mt-5 text-media font-bold text-cac-navy">{t('cases.outcomes')}</h2>
              <p className="mt-2 text-pequena text-cac-muted">{item.outcomes}</p>
            </>
          ) : null}
        </article>
        <aside className="space-y-3">
          <div className="rounded-[16px] border border-cac-line bg-[#fbfcfb] p-4">
            <h3 className="text-pequena font-bold text-cac-navy">{t('cases.evidence')}</h3>
            <ul className="mt-2 space-y-2">
              {item.media.map((m) => (
                <li key={m.id} className="text-mini text-cac-muted">
                  {m.caption || m.filename}
                </li>
              ))}
              {!item.media.length ? <li className="text-mini text-cac-muted">{t('detail.emptyList')}</li> : null}
            </ul>
          </div>
          <div className="rounded-[16px] border border-cac-line bg-white p-4">
            <h3 className="text-pequena font-bold text-cac-navy">{t('cases.needs')}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.needs.map((n) => (
                <Chip key={n.id}>
                  {n.needType}
                  {n.detail ? `: ${n.detail}` : ''}
                </Chip>
              ))}
            </div>
          </div>
          {item.organization ? (
            <Link to={`/organizations/${item.organization.slug}`} className="block text-pequena font-bold text-cac-green">
              {item.organization.name}
            </Link>
          ) : null}
          <Link to="/cases" className="inline-block text-pequena font-bold text-cac-green">
            {t('cases.back')}
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}
