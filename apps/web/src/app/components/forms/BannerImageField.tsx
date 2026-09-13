import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BannerPosition, BANNER_POSITIONS, type BannerPosition as BannerPositionType } from '@cac/shared';
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

export function pickBannerPosition(
  form: FormData,
  name = 'bannerPosition',
): BannerPositionType {
  const raw = String(form.get(name) || '').trim();
  if ((BANNER_POSITIONS as readonly string[]).includes(raw)) {
    return raw as BannerPositionType;
  }
  return BannerPosition.ABOVE_FOOTER;
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
  /** Posição na página de detalhe. */
  positionName?: string;
  currentPosition?: BannerPositionType | string | null;
  positionValue?: BannerPositionType | string;
  onPositionChange?: (value: BannerPositionType) => void;
  showPositionField?: boolean;
};

const ACCEPT = 'image/jpeg,image/png,image/webp';

const POSITION_LABEL_KEYS: Record<BannerPositionType, string> = {
  ABOVE_HERO: 'catalog.bannerPositionAboveHero',
  BELOW_HERO: 'catalog.bannerPositionBelowHero',
  ABOVE_FOOTER: 'catalog.bannerPositionAboveFooter',
};

/** Miniatura esquemática da página de detalhe com o banner destacado. */
function BannerPositionPreview({ position }: { position: BannerPositionType }) {
  return (
    <div
      className="relative mx-auto aspect-[3/4] w-full max-w-[5.5rem] overflow-hidden rounded-md border border-cac-line bg-white"
      aria-hidden
    >
      {/* hero */}
      <div
        className={`absolute inset-x-0 ${
          position === BannerPosition.ABOVE_HERO ? 'top-[12%]' : 'top-0'
        } h-[28%] bg-[#0e2f4f]`}
      />
      {/* conteúdo */}
      <div className="absolute inset-x-[12%] top-[46%] h-[7%] rounded-[2px] bg-[#dce3e8]" />
      <div className="absolute inset-x-[12%] top-[56%] h-[7%] rounded-[2px] bg-[#e4eaee]" />
      <div className="absolute inset-x-[12%] top-[66%] h-[7%] rounded-[2px] bg-[#eaf0f3]" />
      {/* footer */}
      <div className="absolute inset-x-0 bottom-0 h-[10%] bg-[#edf1f3]" />
      {/* faixa do banner */}
      {position === BannerPosition.ABOVE_HERO ? (
        <div className="absolute inset-x-0 top-0 h-[10%] bg-cac-green" />
      ) : null}
      {position === BannerPosition.BELOW_HERO ? (
        <div className="absolute inset-x-0 top-[28%] h-[10%] bg-cac-green" />
      ) : null}
      {position === BannerPosition.ABOVE_FOOTER ? (
        <div className="absolute inset-x-0 bottom-[10%] h-[10%] bg-cac-green" />
      ) : null}
    </div>
  );
}

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
  positionName = 'bannerPosition',
  currentPosition,
  positionValue,
  onPositionChange,
  showPositionField = true,
}: Props) {
  const { t } = useTranslation();
  const inputId = useId();
  const linkId = useId();
  const positionGroupId = useId();
  const controlled = onChange !== undefined;
  const linkControlled = onLinkChange !== undefined;
  const positionControlled = onPositionChange !== undefined;
  const [preview, setPreview] = useState<string | null>(resolveMediaUrl(currentUrl));
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [localPosition, setLocalPosition] = useState<BannerPositionType>(() => {
    const initial = currentPosition || BannerPosition.ABOVE_FOOTER;
    if ((BANNER_POSITIONS as readonly string[]).includes(String(initial))) {
      return initial as BannerPositionType;
    }
    return BannerPosition.ABOVE_FOOTER;
  });

  const resolvedPosition: BannerPositionType = positionControlled
    ? ((BANNER_POSITIONS as readonly string[]).includes(String(positionValue))
        ? (positionValue as BannerPositionType)
        : BannerPosition.ABOVE_FOOTER)
    : localPosition;

  useEffect(() => {
    if (positionControlled) return;
    const next = currentPosition || BannerPosition.ABOVE_FOOTER;
    if ((BANNER_POSITIONS as readonly string[]).includes(String(next))) {
      setLocalPosition(next as BannerPositionType);
    }
  }, [positionControlled, currentPosition]);

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
    <div className="space-y-3 rounded-xl border border-cac-line bg-white p-4">
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

      {showPositionField ? (
        <fieldset className="space-y-2" aria-labelledby={positionGroupId}>
          <legend id={positionGroupId} className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
            {t('catalog.bannerPosition')}
          </legend>
          <p className="text-mini leading-snug text-cac-muted">{t('catalog.bannerPositionHint')}</p>
          {!positionControlled ? (
            <input type="hidden" name={positionName} value={resolvedPosition} />
          ) : null}
          <div className="grid grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-labelledby={positionGroupId}>
            {BANNER_POSITIONS.map((pos) => {
              const selected = resolvedPosition === pos;
              return (
                <button
                  key={pos}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    if (positionControlled) onPositionChange?.(pos);
                    else setLocalPosition(pos);
                  }}
                  className={`flex flex-col gap-2 rounded-[12px] border px-2 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cac-green2/40 ${
                    selected
                      ? 'border-cac-green bg-cac-green3 shadow-[0_0_0_1px_rgba(46,125,90,.25)]'
                      : 'border-cac-line bg-white hover:border-cac-green/40'
                  }`}
                >
                  <BannerPositionPreview position={pos} />
                  <span
                    className={`text-center text-[0.65rem] font-extrabold leading-tight tracking-[0.2px] uppercase sm:text-mini ${
                      selected ? 'text-cac-navy' : 'text-cac-muted'
                    }`}
                  >
                    {t(POSITION_LABEL_KEYS[pos])}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

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
