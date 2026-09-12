import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveMediaUrl } from './RepresentativeImageField';

/** Lê o arquivo de banner do FormData (campo `bannerImage`). */
export function pickBannerFile(form: FormData): File | null {
  const value = form.get('bannerImage');
  return value instanceof File && value.size > 0 ? value : null;
}

export function pickBannerLink(form: FormData, name = 'bannerLinkUrl'): string | null {
  const raw = String(form.get(name) || '').trim();
  return raw || null;
}

export const BANNER_MAX_BYTES = 400 * 1024;
export const BANNER_TARGET_WIDTH = 1200;
export const BANNER_TARGET_HEIGHT = 200;
export const BANNER_ASPECT = BANNER_TARGET_WIDTH / BANNER_TARGET_HEIGHT; // 6

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('invalid_image'));
    };
    img.src = url;
  });
}

/** Valida arquivo de banner: ≤400 KB e 1200×200 (ou proporção equivalente dentro do envelope). */
export async function validateBannerFile(
  file: File,
): Promise<'ok' | 'too_large' | 'bad_dimensions' | 'invalid_image'> {
  if (file.size > BANNER_MAX_BYTES) return 'too_large';
  try {
    const { width, height } = await readImageSize(file);
    if (width < 1 || height < 1) return 'invalid_image';
    if (width > BANNER_TARGET_WIDTH || height > BANNER_TARGET_HEIGHT) return 'bad_dimensions';
    const ratio = width / height;
    if (Math.abs(ratio - BANNER_ASPECT) > 0.08) return 'bad_dimensions';
    return 'ok';
  } catch {
    return 'invalid_image';
  }
}

type Props = {
  /** URL já salva (edição) — relativa `/uploads/...` ou absoluta. */
  currentUrl?: string | null;
  /** Nome do input file (padrão `bannerImage` para publicações). */
  name?: string;
  label?: string;
  hint?: string;
  emptyLabel?: string;
  /** Controle externo (ex.: modal de org) em vez de FormData. */
  file?: File | null;
  onChange?: (file: File | null) => void;
  /** Campo de link do banner (FormData ou controlado). */
  linkName?: string;
  currentLink?: string | null;
  linkValue?: string;
  onLinkChange?: (value: string) => void;
  showLinkField?: boolean;
};

const ACCEPT = 'image/jpeg,image/png,image/webp';

export function BannerImageField({
  currentUrl,
  name = 'bannerImage',
  label,
  hint,
  emptyLabel,
  file,
  onChange,
  linkName = 'bannerLinkUrl',
  currentLink,
  linkValue,
  onLinkChange,
  showLinkField = true,
}: Props) {
  const { t } = useTranslation();
  const inputId = useId();
  const linkId = useId();
  const controlled = onChange !== undefined;
  const linkControlled = onLinkChange !== undefined;
  const [preview, setPreview] = useState<string | null>(resolveMediaUrl(currentUrl));
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (controlled && file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(resolveMediaUrl(currentUrl));
    return undefined;
  }, [controlled, file, currentUrl]);

  useEffect(() => {
    return () => {
      if (!controlled && preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [controlled, preview]);

  async function handleFile(next: File | null, input: HTMLInputElement) {
    if (!next) {
      setErrorKey(null);
      if (controlled) onChange?.(null);
      else {
        if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
        setPreview(resolveMediaUrl(currentUrl));
      }
      return;
    }
    const result = await validateBannerFile(next);
    if (result !== 'ok') {
      setErrorKey(
        result === 'too_large'
          ? 'catalog.bannerTooLarge'
          : result === 'bad_dimensions'
            ? 'catalog.bannerBadDimensions'
            : 'catalog.bannerInvalidImage',
      );
      input.value = '';
      if (controlled) onChange?.(null);
      return;
    }
    setErrorKey(null);
    if (controlled) {
      onChange?.(next);
      return;
    }
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(next));
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
          {label ?? t('catalog.bannerImage')}
        </label>
        <p className="text-mini leading-snug text-cac-muted">{hint ?? t('catalog.bannerImageHint')}</p>
        <div className="flex flex-wrap items-start gap-3">
          <div className="aspect-[6/1] w-full max-w-md overflow-hidden border border-cac-line bg-[#edf1f3]">
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center px-2 text-center text-mini text-cac-muted">
                {emptyLabel ?? t('catalog.bannerImageEmpty')}
              </div>
            )}
          </div>
          <input
            id={inputId}
            name={controlled ? undefined : name}
            type="file"
            accept={ACCEPT}
            className="max-w-full text-pequena text-cac-navy file:mr-3 file:rounded-[10px] file:border-0 file:bg-cac-green3 file:px-3 file:py-2 file:text-pequena file:font-extrabold file:text-cac-navy hover:file:brightness-95"
            onChange={(e) => {
              const next = e.target.files?.[0] ?? null;
              void handleFile(next, e.target);
            }}
          />
        </div>
        {errorKey ? <p className="text-mini text-red-700">{t(errorKey)}</p> : null}
      </div>

      {showLinkField ? (
        <label htmlFor={linkId} className="block space-y-1">
          <span className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
            {t('catalog.bannerLink')}
          </span>
          <span className="block text-mini leading-snug text-cac-muted">{t('catalog.bannerLinkHint')}</span>
          <input
            id={linkId}
            name={linkControlled ? undefined : linkName}
            type="url"
            placeholder="https://"
            value={linkControlled ? (linkValue ?? '') : undefined}
            defaultValue={linkControlled ? undefined : (currentLink ?? '')}
            onChange={linkControlled ? (e) => onLinkChange?.(e.target.value) : undefined}
            className="w-full rounded-lg border border-cac-line bg-white px-2.5 py-2 text-pequena text-cac-navy outline-none focus:ring-2 focus:ring-cac-green2/40"
          />
        </label>
      ) : null}
    </div>
  );
}
