import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catalogApi, type Attachment, type AttachmentTarget } from '../api/catalogApi';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { DetailSection } from './CatalogDetail';

type Attachments = { gallery: Attachment[]; documents: Attachment[] };

/** Galeria e outros documentos publicados de uma publicação (vazio enquanto carrega ou em erro). */
export function usePublicationAttachments(kind: AttachmentTarget, id: string | null | undefined): Attachments {
  const { i18n } = useTranslation();
  const [data, setData] = useState<Attachments>({ gallery: [], documents: [] });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void catalogApi
      .listAttachments(kind, id)
      .then((res) => {
        if (!cancelled) setData({ gallery: res.gallery ?? [], documents: res.documents ?? [] });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [kind, id, i18n.language]);

  return data;
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1).replace('.0', '')} MB`;
}

const DOC_ICON: Record<string, { icon: string; color: string }> = {
  pdf: { icon: 'fa-file-pdf', color: 'text-red-700' },
  doc: { icon: 'fa-file-word', color: 'text-blue-700' },
  docx: { icon: 'fa-file-word', color: 'text-blue-700' },
  odt: { icon: 'fa-file-word', color: 'text-blue-700' },
  rtf: { icon: 'fa-file-word', color: 'text-blue-700' },
  xls: { icon: 'fa-file-excel', color: 'text-emerald-700' },
  xlsx: { icon: 'fa-file-excel', color: 'text-emerald-700' },
  ods: { icon: 'fa-file-excel', color: 'text-emerald-700' },
  csv: { icon: 'fa-file-csv', color: 'text-emerald-700' },
  ppt: { icon: 'fa-file-powerpoint', color: 'text-orange-600' },
  pptx: { icon: 'fa-file-powerpoint', color: 'text-orange-600' },
  odp: { icon: 'fa-file-powerpoint', color: 'text-orange-600' },
  txt: { icon: 'fa-file-lines', color: 'text-cac-muted' },
};

export function GallerySection({ items, index }: { items: Attachment[]; index?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(null);
  const total = items.length;

  const step = useCallback(
    (delta: number) => setOpen((current) => (current === null ? null : (current + delta + total) % total)),
    [total],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null);
      else if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, step]);

  if (!total) return null;
  const current = open === null ? null : items[open];

  return (
    <DetailSection title={t('detail.gallery')} index={index}>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={item.title || t('detail.galleryOpen', { n: i + 1 })}
              className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cac-green rounded-[12px]"
            >
              <span className="block aspect-[4/3] w-full overflow-hidden rounded-[12px] border border-cac-line bg-[#edf1f3]">
                <img
                  src={resolveMediaUrl(item.url) ?? item.url}
                  alt={item.title || item.description || ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                />
              </span>
              {item.title ? (
                <span className="mt-1.5 line-clamp-2 block text-mini font-bold leading-snug text-cac-navy group-hover:text-cac-green">
                  {item.title}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('detail.gallery')}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a2440]/90 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label={t('detail.galleryClose')}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <i className="fa-solid fa-xmark text-[1.1rem]" aria-hidden />
          </button>
          {total > 1 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                step(-1);
              }}
              aria-label={t('detail.galleryPrev')}
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:left-6"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden />
            </button>
          ) : null}
          <figure className="max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={resolveMediaUrl(current.url) ?? current.url}
              alt={current.title || current.description || ''}
              className={`${current.title || current.description ? 'max-h-[70vh]' : 'max-h-[80vh]'} mx-auto w-auto rounded-[12px] object-contain shadow-[0_20px_60px_rgba(0,0,0,.35)]`}
            />
            <figcaption className="mx-auto mt-3 max-w-2xl text-center text-white">
              {current.title ? <p className="text-media font-bold">{current.title}</p> : null}
              {current.description ? (
                <p className="mt-1 text-pequena leading-relaxed text-white/80">{current.description}</p>
              ) : null}
              <p className="mt-2 text-mini tracking-[1px] text-white/60 uppercase">
                {t('detail.galleryCounter', { n: (open ?? 0) + 1, total })}
              </p>
            </figcaption>
          </figure>
          {total > 1 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                step(1);
              }}
              aria-label={t('detail.galleryNext')}
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:right-6"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
    </DetailSection>
  );
}

export function DocumentsSection({ items, index }: { items: Attachment[]; index?: string }) {
  const { t } = useTranslation();
  if (!items.length) return null;

  return (
    <DetailSection title={t('detail.documents')} index={index}>
      <ul className="space-y-2">
        {items.map((doc) => {
          const ext = fileExtension(doc.filename);
          const icon = DOC_ICON[ext] ?? { icon: 'fa-file', color: 'text-cac-muted' };
          return (
            <li key={doc.id}>
              <a
                href={resolveMediaUrl(doc.url) ?? doc.url}
                target="_blank"
                rel="noopener noreferrer"
                download={doc.filename}
                aria-label={`${t('detail.documentsDownload')} ${doc.title || doc.filename}`}
                className="group flex items-start gap-3 rounded-[12px] border border-cac-line bg-[#fbfcfb] px-3.5 py-3 text-cac-navy transition hover:border-cac-green/50"
              >
                <i className={`fa-solid ${icon.icon} mt-0.5 text-[1.25rem] ${icon.color}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-pequena font-bold group-hover:text-cac-green">
                    {doc.title || doc.filename}
                  </span>
                  {doc.description ? (
                    <span className="mt-0.5 line-clamp-3 block text-mini leading-snug text-cac-muted">
                      {doc.description}
                    </span>
                  ) : null}
                  <span className="mt-1 block truncate text-mini font-semibold text-cac-muted/80">
                    {doc.title ? `${doc.filename} · ` : ''}
                    <span className="uppercase">{ext ? `${ext} · ` : ''}</span>
                    {formatBytes(doc.size)}
                  </span>
                </span>
                <i className="fa-solid fa-download mt-1 text-[0.85rem] text-cac-muted group-hover:text-cac-green" aria-hidden />
              </a>
            </li>
          );
        })}
      </ul>
    </DetailSection>
  );
}
