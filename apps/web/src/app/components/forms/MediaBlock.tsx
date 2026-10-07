import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentsField, GalleryField, type PublicationAttachments } from './AttachmentsField';
import { BannerImageField } from './BannerImageField';
import { FieldFull } from './FormPage';
import { RepresentativeImageField } from './RepresentativeImageField';

type MediaTab = 'media' | 'gallery' | 'documents';

type Props = {
  /** Campos extras entre a imagem representativa e o banner (ex.: URL do vídeo). */
  children?: ReactNode;
  /** Imagem representativa já salva (edição). */
  coverUrl?: string | null;
  /** Banner já salvo (edição). */
  banner?: { currentUrl?: string | null; currentLink?: string | null; currentPosition?: string | null };
  /** Galeria e documentos já salvos (edição). */
  attachments?: PublicationAttachments;
};

/** Bloco de mídias: abas Mídias (capa + banner), Galeria e Outros documentos — todas montadas para o FormData. */
export function MediaBlock({ children, coverUrl, banner, attachments }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<MediaTab>('media');
  const tabs: { id: MediaTab; label: string; count?: number }[] = [
    { id: 'media', label: t('catalog.mediaTabMedia') },
    { id: 'gallery', label: t('catalog.mediaTabGallery'), count: attachments?.gallery.length },
    { id: 'documents', label: t('catalog.mediaTabDocuments'), count: attachments?.documents.length },
  ];

  return (
    <FieldFull>
      <section className="mt-2 space-y-4 rounded-[16px] border border-cac-green/30 bg-cac-green3/30 p-4 shadow-cac md:p-5">
        <header className="border-b border-cac-green/20 pb-3">
          <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">
            {t('catalog.mediaBlockTitle')}
          </p>
          <p className="mt-1 text-mini leading-snug text-cac-muted">{t('catalog.mediaBlockHint')}</p>
        </header>

        <div role="tablist" className="flex flex-wrap gap-1 border-b border-cac-green/20">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-pequena font-bold transition ${
                tab === item.id
                  ? 'border-cac-green text-cac-navy'
                  : 'border-transparent text-cac-muted hover:text-cac-navy'
              }`}
            >
              {item.label}
              {item.count ? (
                <span className="rounded-full bg-cac-green px-1.5 text-[0.65rem] font-extrabold leading-[1.4] text-white">
                  {item.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div role="tabpanel" className={`space-y-4 ${tab === 'media' ? '' : 'hidden'}`}>
          <RepresentativeImageField currentUrl={coverUrl} />
          {children}
          <BannerImageField
            currentUrl={banner?.currentUrl}
            currentLink={banner?.currentLink}
            currentPosition={banner?.currentPosition ?? undefined}
          />
        </div>
        <div role="tabpanel" className={tab === 'gallery' ? '' : 'hidden'}>
          <GalleryField existing={attachments?.gallery} />
        </div>
        <div role="tabpanel" className={tab === 'documents' ? '' : 'hidden'}>
          <DocumentsField existing={attachments?.documents} />
        </div>
      </section>
    </FieldFull>
  );
}
