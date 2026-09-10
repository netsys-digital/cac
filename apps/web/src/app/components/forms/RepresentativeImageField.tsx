import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { urls } from '../../../config';

export type CoverKind =
  | 'technologies'
  | 'challenges'
  | 'funding-offers'
  | 'success-cases'
  | 'projects';

/** Lê o arquivo de capa do FormData (campo `coverImage`). */
export function pickCoverFile(form: FormData): File | null {
  const value = form.get('coverImage');
  return value instanceof File && value.size > 0 ? value : null;
}

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${urls.api}${path.startsWith('/') ? path : `/${path}`}`;
}

type Props = {
  /** URL já salva (edição) — relativa `/uploads/...` ou absoluta. */
  currentUrl?: string | null;
};

export function RepresentativeImageField({ currentUrl }: Props) {
  const { t } = useTranslation();
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(resolveMediaUrl(currentUrl));

  useEffect(() => {
    setPreview(resolveMediaUrl(currentUrl));
  }, [currentUrl]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
        {t('catalog.coverImage')}
      </label>
      <p className="text-mini leading-snug text-cac-muted">{t('catalog.coverImageHint')}</p>
      <div className="flex flex-wrap items-start gap-3">
        <div className="h-28 w-40 overflow-hidden rounded-[12px] border border-cac-line bg-[#edf1f3]">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center px-2 text-center text-mini text-cac-muted">
              {t('catalog.coverImageEmpty')}
            </div>
          )}
        </div>
        <input
          id={inputId}
          name="coverImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="max-w-full text-pequena text-cac-navy file:mr-3 file:rounded-[10px] file:border-0 file:bg-cac-green3 file:px-3 file:py-2 file:text-pequena file:font-extrabold file:text-cac-navy hover:file:brightness-95"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
            setPreview(file ? URL.createObjectURL(file) : resolveMediaUrl(currentUrl));
          }}
        />
      </div>
    </div>
  );
}
