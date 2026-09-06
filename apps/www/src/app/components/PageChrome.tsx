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
    <div className={`${shell} py-10 pb-16`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-[10px] font-black tracking-[1.7px] text-cac-green uppercase">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-[32px] leading-tight font-black text-cac-navy">{title}</h1>
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
  tags,
  score,
}: {
  to: string;
  title: string;
  meta: string;
  tags?: string[];
  score?: string;
}) {
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      className="grid grid-cols-[68px_1fr_auto] items-center gap-2.5 rounded-[13px] border border-cac-line bg-white p-3 transition hover:-translate-y-0.5"
    >
      <span className="block h-[60px] rounded-[9px] bg-gradient-to-br from-[#d5ebde] to-[#91b58b]" />
      <span>
        <span className="block text-[11px] font-black text-cac-navy">{title}</span>
        <span className="mt-1 block text-[10px] leading-snug text-cac-muted">{meta}</span>
        {tags?.length ? (
          <span className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </span>
        ) : null}
      </span>
      <span className="text-right">
        {score ? <b className="block text-[21px] text-cac-green">{score}</b> : null}
        <span className="mt-1 inline-flex rounded-[10px] border border-cac-green bg-white px-3 py-2 text-[11px] font-black text-cac-green">
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
