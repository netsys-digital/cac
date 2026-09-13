import type { PropsWithChildren, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Chip, shell } from './PageChrome';
import { BackToSearchLink } from './BackToSearchLink';
import { isDirectVideoFile, toVideoEmbedUrl } from '../lib/videoEmbed';
import { resolveMediaUrl } from '../lib/mediaUrl';

function orgInitials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return letters || name.slice(0, 2).toUpperCase();
}

export function OrgLogo({
  name,
  logoUrl,
  size = 'md',
}: {
  name: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const logo = resolveMediaUrl(logoUrl);
  const box = size === 'lg' ? 'h-20 w-20' : size === 'sm' ? 'h-10 w-10' : 'h-11 w-11';
  const text = size === 'lg' ? 'text-media' : 'text-pequena';
  if (logo) {
    return (
      <span
        className={`grid ${box} shrink-0 place-items-center overflow-hidden rounded-xl border border-cac-line bg-white`}
      >
        <img src={logo} alt="" className="h-full w-full object-contain p-1" />
      </span>
    );
  }
  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#0a2440,#1a4d4a)] font-bold text-[#90d6b6] ${text}`}
    >
      {orgInitials(name)}
    </span>
  );
}

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
  topBanner,
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
  /** Banner promocional no topo interno do hero (posição ABOVE_HERO). */
  topBanner?: ReactNode;
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
        {topBanner ? <div className="mb-6 md:mb-8">{topBanner}</div> : null}
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
            <h1 className="mt-3 text-grande leading-[1.15] font-bold text-white">
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
export function DetailHeroStatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <div className="flex min-h-[5.5rem] flex-col justify-between rounded-[16px] border border-white/20 bg-white/[0.14] px-4 py-3.5 shadow-[0_14px_32px_rgba(0,0,0,.22)] backdrop-blur-[6px]">
      <div className="flex items-center gap-2">
        {icon ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/12">
            <i className={`${icon} text-[0.85rem] text-[#90d6b6]`} aria-hidden />
          </span>
        ) : null}
        <p className="text-mini font-bold tracking-[1.3px] text-[#90d6b6] uppercase">{label}</p>
      </div>
      <p className="mt-2 text-media font-bold leading-snug text-white">{value}</p>
    </div>
  );
}

export function DetailHeroStatGrid({ children }: PropsWithChildren) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-3.5">{children}</div>;
}

export function CatalogDetailBody({
  children,
  pullUp = true,
}: PropsWithChildren<{ pullUp?: boolean }>) {
  return (
    <div
      className={`${shell} relative z-[1] pb-16 ${pullUp ? '-mt-4 md:-mt-6' : 'mt-6 md:mt-8'}`}
    >
      {children}
    </div>
  );
}

/** Banner promocional — posição: acima do hero, abaixo do hero ou acima do footer. */
export function CatalogDetailBanner({
  bannerUrl,
  linkUrl,
  position = 'ABOVE_FOOTER',
}: {
  bannerUrl?: string | null;
  linkUrl?: string | null;
  position?: 'ABOVE_HERO' | 'BELOW_HERO' | 'ABOVE_FOOTER';
}) {
  const { t } = useTranslation();
  const resolved = resolveMediaUrl(bannerUrl);
  const href = linkUrl?.trim() || null;
  const aboveHero = position === 'ABOVE_HERO';
  const belowHero = position === 'BELOW_HERO';

  const media = resolved ? (
    <img
      src={resolved}
      alt=""
      className="aspect-[6/1] max-h-[8.5rem] w-full object-cover md:max-h-[10rem]"
    />
  ) : (
    <div
      className="relative aspect-[6/1] max-h-[8.5rem] w-full overflow-hidden bg-[#e8f0ec] md:max-h-[10rem]"
      aria-hidden
    >
      <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,#e8f0ec_0%,#f4f8f6_40%,#dce8e2_55%,#e8f0ec_100%)] bg-[length:200%_100%]" />
      <div className="absolute inset-x-[8%] top-[28%] h-[18%] max-w-[40%] rounded-md bg-white/50" />
      <div className="absolute inset-x-[8%] top-[52%] h-[10%] max-w-[28%] rounded-md bg-white/35" />
      <div className="absolute inset-y-[18%] right-[-4%] w-[42%] skew-x-[-10deg] bg-[rgba(10,36,64,.06)]" />
    </div>
  );

  const inner = (
    <>
      <span className="pointer-events-none absolute top-0 right-0 z-[1] bg-[rgba(10,36,64,.72)] px-2 py-0.5 text-[0.625rem] font-bold tracking-[0.12em] text-white uppercase">
        {t('detail.bannerAdLabel')}
      </span>
      {href && resolved ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block">
          {media}
        </a>
      ) : (
        media
      )}
    </>
  );

  if (aboveHero) {
    return (
      <div className="relative overflow-hidden rounded-[12px] border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,.28)]">
        {inner}
      </div>
    );
  }

  if (belowHero) {
    return (
      <div className={`${shell} relative z-[1] -mt-4 md:-mt-6`}>
        <div className="relative overflow-hidden border border-cac-line bg-white">{inner}</div>
      </div>
    );
  }

  return (
    <div className="relative mt-8 overflow-hidden border border-cac-line bg-white md:mt-10">
      {inner}
    </div>
  );
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
          <span className="text-pequena font-bold tracking-[1.5px] text-cac-green uppercase">
            {index}
          </span>
        ) : null}
        <h2 className="text-grande font-bold text-cac-navy">{title}</h2>
      </div>
      <div className="max-w-[42rem] text-pequena leading-relaxed text-cac-ink/85">{children}</div>
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
  logoUrl,
}: {
  to: string;
  name: string;
  summary?: string | null;
  label: string;
  verifiedLabel: string;
  verified?: boolean;
  logoUrl?: string | null;
}) {
  const logo = resolveMediaUrl(logoUrl);
  return (
    <Link
      to={to}
      className="block overflow-hidden rounded-[16px] border border-cac-line bg-white shadow-[0_10px_28px_rgba(10,36,64,.06)] transition hover:-translate-y-0.5 hover:border-cac-green/35"
    >
      <div className="relative h-[8.5rem] w-full overflow-hidden bg-[#eef6f1]">
        {logo ? (
          <span
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${logo})` }}
            aria-hidden
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#0a2440,#1a4d4a)] text-media font-bold text-[#90d6b6]">
              {orgInitials(name)}
            </span>
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-mini font-bold tracking-[1.4px] text-cac-green uppercase">{label}</p>
          {verified ? (
            <span className="rounded-md bg-cac-green3 px-2 py-0.5 text-mini font-bold text-cac-green">
              {verifiedLabel}
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 text-media font-bold text-cac-navy">{name}</h3>
        {summary ? (
          <p className="mt-1.5 line-clamp-3 text-pequena leading-snug text-cac-muted">{summary}</p>
        ) : null}
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
  icon,
  done,
}: PropsWithChildren<{ href: string; icon?: string; done?: boolean }>) {
  return (
    <a
      href={href}
      className={`flex w-full items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-pequena font-bold text-white transition hover:brightness-105 ${
        done ? 'bg-[#1f6b4a]' : 'bg-cac-green2'
      }`}
    >
      {icon ? <i className={`${icon} text-[1.05rem]`} aria-hidden /> : null}
      {children}
    </a>
  );
}

export function DetailSecondaryButton({
  href,
  children,
  icon,
  done,
}: PropsWithChildren<{ href: string; icon?: string; done?: boolean }>) {
  return (
    <a
      href={href}
      className={`flex w-full items-center justify-center gap-2 rounded-[12px] border px-4 py-3 text-pequena font-bold transition ${
        done
          ? 'border-cac-green/45 bg-[#eef7f1] text-cac-green'
          : 'border-cac-line bg-[#f7faf8] text-cac-navy hover:border-cac-green/40 hover:bg-white'
      }`}
    >
      {icon ? <i className={`${icon} text-[1.05rem]`} aria-hidden /> : null}
      {children}
    </a>
  );
}

export { DetailFavoriteButton } from './FavoriteButton';
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
