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
            <p className="text-[0.65rem] font-black tracking-[1.7px] text-cac-green uppercase">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-[2rem] leading-tight font-black text-cac-navy md:text-[2.15rem]">{title}</h1>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function Chip({ children }: PropsWithChildren) {
  return (
    <span className="rounded-lg bg-cac-green3 px-2 py-1 text-[10px] font-extrabold text-cac-green">
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
  onNavigate,
}: {
  to: string;
  title: string;
  meta: string;
  summary?: string;
  tags?: string[];
  score?: string;
  factors?: Array<{ label: string; weight: number; value: number }>;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const topFactors = (factors ?? [])
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return (
    <Link
      to={to}
      onClick={() => onNavigate?.()}
      className="grid grid-cols-[1fr_auto] items-start gap-3 rounded-[13px] border border-cac-line bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-cac-green/40 sm:grid-cols-[4.5rem_1fr_auto] sm:items-center sm:gap-3"
    >
      <span className="hidden h-[4.25rem] rounded-[9px] bg-gradient-to-br from-[#d5ebde] to-[#91b58b] sm:block" />
      <span className="min-w-0">
        <span className="block text-[0.8rem] font-black leading-snug text-cac-navy sm:text-[0.85rem]">
          {title}
        </span>
        <span className="mt-1 block text-[0.7rem] leading-snug text-cac-muted">{meta}</span>
        {summary ? (
          <span className="mt-1.5 line-clamp-2 block text-[0.7rem] leading-relaxed text-cac-navy/80">
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
          <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.65rem] text-cac-muted">
            {topFactors.map((factor) => (
              <span key={factor.label}>
                {factor.label}: <b className="text-cac-navy">{Math.round(factor.value)}%</b>
              </span>
            ))}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-right">
        {score ? <b className="block text-[1.35rem] leading-none text-cac-green">{score}</b> : null}
        {score ? (
          <span className="mt-0.5 block text-[0.6rem] font-bold tracking-wide text-cac-muted uppercase">
            {t('search.matchLabel')}
          </span>
        ) : null}
        <span className="mt-2 inline-flex rounded-[10px] border border-cac-green bg-white px-3 py-2 text-[0.7rem] font-black text-cac-green">
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
