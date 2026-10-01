import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BannerImageField } from './BannerImageField';
import { FieldFull } from './FormPage';
import { RepresentativeImageField } from './RepresentativeImageField';

type Props = {
  /** Campos extras entre a imagem representativa e o banner (ex.: URL do vídeo). */
  children?: ReactNode;
};

/** Bloco de mídias das páginas de inclusão: capa + banner (posição e link) enviados já no rascunho. */
export function MediaBlock({ children }: Props) {
  const { t } = useTranslation();
  return (
    <FieldFull>
      <section className="mt-2 space-y-4 rounded-[16px] border border-cac-green/30 bg-cac-green3/30 p-4 shadow-cac md:p-5">
        <header className="border-b border-cac-green/20 pb-3">
          <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">
            {t('catalog.mediaBlockTitle')}
          </p>
          <p className="mt-1 text-mini leading-snug text-cac-muted">{t('catalog.mediaBlockHint')}</p>
        </header>
        <RepresentativeImageField />
        {children}
        <BannerImageField />
      </section>
    </FieldFull>
  );
}
