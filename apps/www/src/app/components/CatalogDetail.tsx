import type { PropsWithChildren, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Chip, shell } from './PageChrome';
import { BackToSearchLink } from './BackToSearchLink';
import { isDirectVideoFile, toVideoEmbedUrl } from '../lib/videoEmbed';

/** Placeholder quando não há vídeo nem capa. */
function AbstractMediaGraphic() {
  return (
    <div
      className="relative h-full w-full bg-[linear-gradient(145deg,#d5ebde_0%,#91b58b_55%,#4b7a50_100%)]"
      aria-hidden
    >
      <div className="absolute inset-x-[-12%] bottom-[-10%] h-[48%] -skew-y-[8deg] bg-[rgba(10,36,64,.28)]" />
      <div className="absolute inset-x-[-8%] top-[18%] h-[22%] -skew-y-[-6deg] bg-white/15" />
      <div className="absolute inset-y-[12%] right-[-6%] w-[28%] skew-x-[-12deg] bg-[rgba(10,36,64,.18)]" />
    </div>
  );
}

/**
 * Hero de detalhe.
 * - Soluções: passar `videoUrl` (prioridade) + `coverImageUrl` (fallback).
 * - Demais entidades (desafio, caso, projeto): só `coverImageUrl`.
 * - Financiamento: preferir `aside` (cards de condições) no lugar da mídia.
 */
export function CatalogDetailHero({
  eyebrow,
  title,
  summary,
  chips,
  aside,
  videoUrl,
  coverImageUrl,
  showBack = true,
}: {
  eyebrow: string;
  title: string;
  summary?: string;
  chips?: ReactNode;
  /** Conteúdo à direita (ex.: cards de condições). Se presente, substitui a mídia. */
  aside?: ReactNode;
  /** Só soluções — vídeo relacionado. Se ausente, usa a capa. */
  videoUrl?: string | null;
  coverImageUrl?: string | null;
  showBack?: boolean;
}) {
  const embedUrl = toVideoEmbedUrl(videoUrl);
  const directFile = embedUrl ? isDirectVideoFile(embedUrl) : false;
  const hasVideo = Boolean(embedUrl);
  const hasCover = Boolean(coverImageUrl);

  return (
    <section className="relative overflow-hidden text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            linear-gradient(
              165deg,
              #0a2440 0%,
              #0e2f4f 28%,
              #123a52 52%,
              #154556 72%,
              #1a4a4f 88%,
              #1c5048 100%
            )
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 90% 70% at 88% 18%, rgba(142,213,181,.22), transparent 58%),
            radial-gradient(ellipse 70% 55% at 8% 78%, rgba(18,58,82,.55), transparent 62%),
            radial-gradient(ellipse 50% 40% at 42% 100%, rgba(247,250,248,.12), transparent 55%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36 md:h-44"
        style={{
          background:
            'linear-gradient(to top, #f7faf8 0%, rgba(247,250,248,.85) 28%, rgba(247,250,248,.35) 58%, transparent 100%)',
        }}
        aria-hidden
      />

      <div className={`${shell} relative cac-fade-up py-8 pb-14 md:py-10 md:pb-16`}>
        <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="flex min-w-0 flex-col">
            {showBack ? (
              <div className="mb-6">
                <BackToSearchLink />
              </div>
            ) : null}
            <p className="text-mini font-bold tracking-[1.8px] text-[#90d6b6] uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-extra-grande leading-[1.15] font-bold text-white">
              {title}
            </h1>
            {summary ? (
              <p className="mt-4 text-media leading-relaxed text-[#dbe8ec]">{summary}</p>
            ) : null}
            {chips ? <div className="mt-5 flex flex-wrap gap-1.5">{chips}</div> : null}
          </div>

          <div className="cac-fade-up-delay w-full min-w-0 lg:pt-10">
            {aside ? (
              aside
            ) : (
              <div className="aspect-video w-full overflow-hidden rounded-[16px] border border-white/15 bg-black/35 shadow-[0_24px_56px_rgba(0,0,0,.38)]">
                {hasVideo && directFile ? (
                  <video
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    src={embedUrl!}
                  />
                ) : hasVideo ? (
                  <iframe
                    title={title}
                    src={embedUrl!}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : hasCover ? (
                  <img
                    src={coverImageUrl!}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <AbstractMediaGraphic />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Card de condição / métrica no hero (ex.: faixa de valor, prazo). */
export function DetailHeroStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[5.5rem] flex-col justify-between rounded-[16px] border border-white/20 bg-white/[0.14] px-4 py-3.5 shadow-[0_14px_32px_rgba(0,0,0,.22)] backdrop-blur-[6px]">
      <p className="text-mini font-bold tracking-[1.3px] text-[#90d6b6] uppercase">{label}</p>
      <p className="mt-2 text-grande font-bold leading-snug text-white">{value}</p>
    </div>
  );
}

export function DetailHeroStatGrid({ children }: PropsWithChildren) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-3.5">{children}</div>;
}

export function CatalogDetailBody({ children }: PropsWithChildren) {
  return <div className={`${shell} relative z-[1] -mt-4 pb-16 md:-mt-6`}>{children}</div>;
}

export function DetailSection({
  title,
  children,
  index,
}: PropsWithChildren<{ title: string; index?: string }>) {
  return (
    <section className="border-b border-cac-line/80 py-7 last:border-b-0 last:pb-0">
      <div className="mb-3 flex items-baseline gap-3">
        {index ? (
          <span className="text-mini font-bold tracking-[1.5px] text-cac-green uppercase">
            {index}
          </span>
        ) : null}
        <h2 className="text-media font-bold text-cac-navy">{title}</h2>
      </div>
      <div className="max-w-[42rem] text-media leading-relaxed text-cac-ink/85">{children}</div>
    </section>
  );
}

export function DetailOrgCard({
  to,
  name,
  summary,
  label,
  verifiedLabel,
  verified,
}: {
  to: string;
  name: string;
  summary?: string | null;
  label: string;
  verifiedLabel: string;
  verified?: boolean;
}) {
  return (
    <Link
      to={to}
      className="block rounded-[16px] border border-cac-line bg-white p-5 shadow-[0_10px_28px_rgba(10,36,64,.06)] transition hover:-translate-y-0.5 hover:border-cac-green/35"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-mini font-bold tracking-[1.4px] text-cac-green uppercase">{label}</p>
        {verified ? (
          <span className="rounded-md bg-cac-green3 px-2 py-0.5 text-mini font-bold text-cac-green">
            {verifiedLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#0a2440,#1a4d4a)] text-pequena font-bold text-[#90d6b6]">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-media font-bold text-cac-navy">{name}</h3>
          {summary ? (
            <p className="mt-1 line-clamp-3 text-pequena leading-snug text-cac-muted">{summary}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function DetailActionStack({ children }: PropsWithChildren) {
  return (
    <div className="sticky top-[90px] space-y-3 rounded-[16px] border border-cac-line bg-white p-5 shadow-[0_10px_28px_rgba(10,36,64,.06)]">
      {children}
    </div>
  );
}

export function DetailPrimaryButton({
  href,
  children,
}: PropsWithChildren<{ href: string }>) {
  return (
    <a
      href={href}
      className="flex w-full items-center justify-center rounded-[12px] bg-cac-green2 px-4 py-3 text-pequena font-bold text-white transition hover:brightness-105"
    >
      {children}
    </a>
  );
}

export function DetailSecondaryButton({
  href,
  children,
}: PropsWithChildren<{ href: string }>) {
  return (
    <a
      href={href}
      className="flex w-full items-center justify-center rounded-[12px] border border-cac-line bg-[#f7faf8] px-4 py-3 text-pequena font-bold text-cac-navy transition hover:border-cac-green/40 hover:bg-white"
    >
      {children}
    </a>
  );
}

export function DetailMetaChip({ children }: PropsWithChildren) {
  return (
    <Chip>
      <span className="text-mini">{children}</span>
    </Chip>
  );
}

export function DetailHeroChip({ children }: PropsWithChildren) {
  return (
    <span className="rounded-lg border border-[#90d6b6]/45 bg-[rgba(10,36,64,.82)] px-2.5 py-1 text-mini font-extrabold tracking-wide text-[#e8f6ee] shadow-[0_2px_8px_rgba(0,0,0,.28)]">
      {children}
    </span>
  );
}
