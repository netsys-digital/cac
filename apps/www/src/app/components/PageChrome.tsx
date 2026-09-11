import type { PropsWithChildren, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const shell = 'mx-auto w-full max-w-[1220px] px-[22px]';

export function PageShell({
  children,
  eyebrow,
  title,
  actions,
}: PropsWithChildren<{ eyebrow?: string; title: string; actions?: ReactNode }>) {
  return (
    <div className={`${shell} py-[2.5rem] pb-[4rem]`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-mini font-bold tracking-[1.7px] text-cac-green uppercase">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-extra-grande leading-[1.08] font-bold tracking-[-0.7px] text-cac-navy">{title}</h1>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function Chip({ children }: PropsWithChildren) {
  return (
    <span className="rounded-lg bg-cac-green3 px-2 py-1 text-mini font-extrabold text-cac-green">
      {children}
    </span>
  );
}

export function ResultCard({
  to,
  title,
  meta,
  summary,
  tags,
  score,
  factors,
  imageUrl,
  imageContain,
  onNavigate,
}: {
  to: string;
  title: string;
  meta: string;
  summary?: string;
  tags?: string[];
  score?: string;
  factors?: Array<{ label: string; weight: number; value: number }>;
  /** Capa resolvida (URL absoluta) — exibida com destaque à esquerda. */
  imageUrl?: string | null;
  /** Use contain (ex.: logo de organização) em vez de cover. */
  imageContain?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const topFactors = (factors ?? [])
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const media = (
    <span className="relative block h-full min-h-[9.5rem] w-full overflow-hidden rounded-[12px] bg-gradient-to-br from-[#d5ebde] to-[#91b58b] sm:min-h-[10.5rem]">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className={`absolute inset-0 h-full w-full ${imageContain ? 'object-contain bg-white p-4' : 'object-cover'}`}
        />
      ) : (
        <>
          <span className="absolute inset-x-[-10%] bottom-[-8%] h-[46%] -skew-y-[8deg] bg-[rgba(75,122,80,.35)]" />
          <span className="absolute inset-x-[-8%] top-[18%] h-[22%] -skew-y-[-6deg] bg-white/20" />
        </>
      )}
    </span>
  );

  return (
    <Link
      to={to}
      onClick={() => onNavigate?.()}
      className="grid grid-cols-1 gap-3 rounded-[13px] border border-cac-line bg-white p-3 transition hover:-translate-y-0.5 hover:border-cac-green/40 sm:grid-cols-[11.5rem_minmax(0,1fr)_auto] sm:items-stretch sm:gap-4 sm:p-3.5"
    >
      <span className="block sm:self-stretch">{media}</span>
      <span className="min-w-0 self-center">
        <span className="block text-media font-bold leading-snug text-cac-navy">
          {title}
        </span>
        <span className="mt-1 block text-pequena leading-snug text-cac-muted">{meta}</span>
        {summary ? (
          <span className="mt-1.5 line-clamp-2 block text-pequena leading-relaxed text-cac-navy/80">
            {summary}
          </span>
        ) : null}
        {tags?.length ? (
          <span className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 5).map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </span>
        ) : null}
        {topFactors.length ? (
          <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-mini text-cac-muted">
            {topFactors.map((factor) => (
              <span key={factor.label}>
                {factor.label}: <b className="text-cac-navy">{Math.round(factor.value)}%</b>
              </span>
            ))}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center sm:text-right">
        <span>
          {score ? <b className="block text-media leading-none text-cac-green">{score}</b> : null}
          {score ? (
            <span className="mt-0.5 block text-mini font-bold tracking-wide text-cac-muted uppercase">
              {t('search.matchLabel')}
            </span>
          ) : null}
        </span>
        <span className="inline-flex rounded-[10px] border border-cac-green bg-white px-3 py-2 text-pequena font-extrabold text-cac-green">
          {t('detail.open')}
        </span>
      </span>
    </Link>
  );
}

export function DetailPhoto() {
  return (
    <div className="relative h-[165px] overflow-hidden rounded-[12px] bg-gradient-to-br from-[#b8d7bf] to-[#dce9d3]">
      <div className="absolute inset-x-[-10%] bottom-[-8%] h-[46%] -skew-y-[8deg] bg-[rgba(75,122,80,.38)]" />
    </div>
  );
}
