import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { SearchResponse } from '../../api/searchApi';

type Props = {
  paths: SearchResponse['paths'];
  labels: {
    title: string;
    solve: string;
    fund: string;
    projects: string;
    empty: string;
    active: string;
    directory: string;
  };
};

export function MatchPaths({ paths, labels }: Props) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-media font-bold text-cac-navy">{labels.title}</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <PathColumn title={labels.solve}>
          {paths.whoCanSolve.length ? (
            paths.whoCanSolve.map((item) => (
              <Link
                key={item.organizationId}
                to={item.slug ? `/organizations/${item.slug}` : '/search'}
                className="block rounded-[10px] border border-cac-line bg-white px-3 py-2"
              >
                <span className="block text-pequena font-bold text-cac-navy">{item.name}</span>
                <span className="text-mini text-cac-green">{item.score}%</span>
              </Link>
            ))
          ) : (
            <p className="text-mini text-cac-muted">{labels.empty}</p>
          )}
        </PathColumn>
        <PathColumn title={labels.fund}>
          {paths.whoCanFund.length ? (
            paths.whoCanFund.map((item) => {
              const body = (
                <>
                  <span className="block text-pequena font-bold text-cac-navy">{item.name}</span>
                  <span className="text-mini text-cac-muted">
                    {item.kind === 'ACTIVE_OFFER' ? labels.active : labels.directory} · {item.score}%
                  </span>
                </>
              );
              return item.slug ? (
                <Link
                  key={item.id}
                  to={`/funding?q=${encodeURIComponent(item.name)}`}
                  className="block rounded-[10px] border border-cac-line bg-white px-3 py-2 transition hover:border-cac-green/40"
                >
                  {body}
                </Link>
              ) : (
                <div key={item.id} className="rounded-[10px] border border-cac-line bg-white px-3 py-2">
                  {body}
                </div>
              );
            })
          ) : (
            <p className="text-mini text-cac-muted">{labels.empty}</p>
          )}
        </PathColumn>
        <PathColumn title={labels.projects}>
          {paths.relatedProjects.length ? (
            paths.relatedProjects.map((item) => (
              <Link
                key={item.id}
                to={item.slug ? `/projects/${item.slug}` : '/search'}
                className="block rounded-[10px] border border-cac-line bg-white px-3 py-2"
              >
                <span className="block text-pequena font-bold text-cac-navy">{item.title}</span>
                <span className="text-mini text-cac-green">
                  {item.type} · {item.score}%
                </span>
              </Link>
            ))
          ) : (
            <p className="text-mini text-cac-muted">{labels.empty}</p>
          )}
        </PathColumn>
      </div>
    </section>
  );
}

function PathColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-cac-line bg-[#fbfcfb] p-3">
      <h3 className="mb-2 text-pequena font-bold tracking-wide text-cac-green uppercase">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
