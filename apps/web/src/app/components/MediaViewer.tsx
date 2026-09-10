import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { resolveMediaUrl } from './forms/RepresentativeImageField';

export type MediaViewerItem = {
  /** Caminho relativo `/uploads/...` ou URL absoluta. */
  url: string;
  label: string;
};

type Props = {
  items: MediaViewerItem[];
  index: number;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
};

function isPdf(url: string) {
  return /\.pdf($|\?)/i.test(url);
}

export function MediaViewer({ items, index, onClose, onChangeIndex }: Props) {
  const { t } = useTranslation();
  const current = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onChangeIndex(index - 1);
      if (e.key === 'ArrowRight' && hasNext) onChangeIndex(index + 1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasNext, hasPrev, index, onChangeIndex, onClose]);

  if (!current) return null;

  const src = resolveMediaUrl(current.url);
  if (!src) return null;
  const pdf = isPdf(current.url);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] text-white"
      role="dialog"
      aria-modal="true"
      aria-label={current.label}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-zoom-out border-0 bg-[rgba(2,6,23,.94)] p-0"
        onClick={onClose}
        aria-label={t('mediaViewer.closeAria')}
      />

      <header className="absolute inset-x-0 top-0 z-[2] flex items-center justify-between gap-4 bg-gradient-to-b from-[rgba(2,6,23,.72)] to-transparent px-4 py-3.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-media font-semibold">{current.label}</span>
          {items.length > 1 ? (
            <span className="text-pequena text-white/70">
              {index + 1} / {items.length}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="text-pequena font-semibold text-white/90 no-underline hover:text-white hover:underline"
          >
            {t('mediaViewer.openOriginal')}
          </a>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 text-[1.35rem] leading-none text-white hover:bg-white/20"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-3 pt-14 pb-4 sm:px-[4.5rem] sm:pt-14 sm:pb-8">
        <div className="pointer-events-auto flex h-full min-h-0 w-full min-w-0 items-center justify-center">
          {pdf ? (
            <iframe
              src={src}
              title={current.label}
              className="h-full max-h-[calc(100vh-5.5rem)] w-full max-w-[1100px] rounded-md border-0 bg-white shadow-[0_24px_80px_rgba(0,0,0,.45)]"
            />
          ) : (
            <img
              src={src}
              alt={current.label}
              className="block h-auto max-h-full w-auto max-w-full select-none rounded-md object-contain shadow-[0_24px_80px_rgba(0,0,0,.45)]"
            />
          )}
        </div>
      </div>

      {hasPrev ? (
        <button
          type="button"
          className="absolute top-1/2 left-4 z-[2] hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-[1.8rem] leading-none text-white hover:bg-white/20 sm:grid"
          onClick={() => onChangeIndex(index - 1)}
          aria-label={t('mediaViewer.prev')}
        >
          ‹
        </button>
      ) : null}

      {hasNext ? (
        <button
          type="button"
          className="absolute top-1/2 right-4 z-[2] hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-[1.8rem] leading-none text-white hover:bg-white/20 sm:grid"
          onClick={() => onChangeIndex(index + 1)}
          aria-label={t('mediaViewer.next')}
        >
          ›
        </button>
      ) : null}
    </div>,
    document.body,
  );
}
