import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { catalogApi, type CallCardKind } from '../../api/catalogApi';
import { FieldFull } from './FormPage';
import { resolveMediaUrl } from './RepresentativeImageField';

const TITLE_MAX = 200;
const SUMMARY_MAX = 400;

/** Lê o arquivo do card de chamada do FormData (campo `cardImage`). */
export function pickCardImageFile(form: FormData): File | null {
  const value = form.get('cardImage');
  return value instanceof File && value.size > 0 ? value : null;
}

/** `true` quando o autor pediu para remover a imagem do card já salva. */
export function pickCardImageRemoved(form: FormData): boolean {
  return form.get('removeCardImage') === '1';
}

/** Título/resumo do card; vazio vira `null` para cair no fallback da publicação. */
export function pickCallCard(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? '').trim() || null;
  return { cardTitle: text('cardTitle'), cardSummary: text('cardSummary') };
}

/** Envia (ou remove) a imagem do card depois que a publicação foi salva. */
export async function saveCallCardImage(token: string, kind: CallCardKind, id: string, form: FormData) {
  const file = pickCardImageFile(form);
  if (file) {
    await catalogApi.uploadCardImage(token, kind, id, file);
  } else if (pickCardImageRemoved(form)) {
    await catalogApi.deleteCardImage(token, kind, id);
  }
}

export type CallCardDefaults = {
  cardImageUrl?: string | null;
  cardTitle?: string | null;
  cardSummary?: string | null;
  /** Imagem representativa salva — usada na pré-visualização quando o card não tem imagem. */
  coverImageUrl?: string | null;
};

/** Extrai os defaults do card a partir do item carregado na edição. */
export function callCardDefaults(item: Record<string, unknown>): CallCardDefaults {
  const text = (key: string) => (typeof item[key] === 'string' ? (item[key] as string) : null);
  return {
    cardImageUrl: text('cardImageUrl'),
    cardTitle: text('cardTitle'),
    cardSummary: text('cardSummary'),
    coverImageUrl: text('coverImageUrl'),
  };
}

type Props = {
  defaults?: CallCardDefaults;
};

function formText(form: HTMLFormElement | null, name: string): string {
  const el = form?.elements.namedItem(name);
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value.trim() : '';
}

/** Card de chamada (destaques e listagens): imagem, título e resumo próprios, com fallback na publicação. */
export function CallCardBlock({ defaults }: Props) {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const fileId = useId();
  const savedImage = resolveMediaUrl(defaults?.cardImageUrl);
  const [cardTitle, setCardTitle] = useState(defaults?.cardTitle ?? '');
  const [cardSummary, setCardSummary] = useState(defaults?.cardSummary ?? '');
  const [imagePreview, setImagePreview] = useState<string | null>(savedImage);
  const [removeSaved, setRemoveSaved] = useState(false);
  const [fallback, setFallback] = useState({
    title: '',
    summary: '',
    image: resolveMediaUrl(defaults?.coverImageUrl),
  });

  useEffect(() => {
    setCardTitle(defaults?.cardTitle ?? '');
    setCardSummary(defaults?.cardSummary ?? '');
    setImagePreview(resolveMediaUrl(defaults?.cardImageUrl));
    setRemoveSaved(false);
  }, [defaults?.cardTitle, defaults?.cardSummary, defaults?.cardImageUrl]);

  useEffect(() => {
    const form = sectionRef.current?.closest('form') ?? null;
    if (!form) return;
    const ownFields = new Set(['cardTitle', 'cardSummary', 'cardImage', 'removeCardImage']);
    let timer: number | undefined;
    const update = (target: EventTarget | null) => {
      setFallback((prev) => {
        let image = prev.image;
        if (target instanceof HTMLInputElement && target.name === 'coverImage') {
          const file = target.files?.[0];
          image = file ? URL.createObjectURL(file) : resolveMediaUrl(defaults?.coverImageUrl);
        }
        const summary = formText(form, 'summary')
          .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/(^|\W)[_*](\S.*?\S|\S)[_*](?=\W|$)/g, '$1$2');
        return { title: formText(form, 'title'), summary, image };
      });
    };
    // Adiado: um setState síncrono no listener nativo re-renderiza os inputs controlados
    // antes do React ler o valor digitado, descartando a tecla.
    const sync = (event?: Event) => {
      const target = event?.target ?? null;
      if (target instanceof HTMLElement && ownFields.has(target.getAttribute('name') ?? '')) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => update(target), 0);
    };
    const onReset = () => {
      setCardTitle('');
      setCardSummary('');
      setImagePreview(null);
      setRemoveSaved(false);
      setFallback({ title: '', summary: '', image: null });
    };
    sync();
    form.addEventListener('input', sync);
    form.addEventListener('change', sync);
    form.addEventListener('reset', onReset);
    return () => {
      window.clearTimeout(timer);
      form.removeEventListener('input', sync);
      form.removeEventListener('change', sync);
      form.removeEventListener('reset', onReset);
    };
  }, [defaults?.coverImageUrl]);

  const previewImage = imagePreview ?? fallback.image;
  const previewTitle = cardTitle.trim() || fallback.title || t('catalog.callCardPreviewTitle');
  const previewSummary = cardSummary.trim() || fallback.summary || t('catalog.callCardPreviewSummary');
  const usingFallback = !cardTitle.trim() && !cardSummary.trim() && !imagePreview;

  return (
    <FieldFull>
      <section
        ref={sectionRef}
        className="mt-2 space-y-4 rounded-[16px] border border-cac-green/30 bg-cac-green3/30 p-4 shadow-cac md:p-5"
      >
        <header className="border-b border-cac-green/20 pb-3">
          <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">
            {t('catalog.callCardTitle')}
          </p>
          <p className="mt-1 text-mini leading-snug text-cac-muted">{t('catalog.callCardHint')}</p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor={fileId}
                className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted"
              >
                {t('catalog.callCardImage')}
              </label>
              <p className="text-mini leading-snug text-cac-muted">{t('catalog.callCardImageHint')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id={fileId}
                  name="cardImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="max-w-full text-pequena text-cac-navy file:mr-3 file:rounded-[10px] file:border-0 file:bg-cac-green3 file:px-3 file:py-2 file:text-pequena file:font-extrabold file:text-cac-navy hover:file:brightness-95"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
                    setImagePreview(file ? URL.createObjectURL(file) : removeSaved ? null : savedImage);
                  }}
                />
                {savedImage ? (
                  <button
                    type="button"
                    className="rounded-[10px] border border-cac-line bg-white px-3 py-2 text-mini font-extrabold text-cac-navy transition hover:bg-[#f7faf8]"
                    onClick={() => {
                      const next = !removeSaved;
                      setRemoveSaved(next);
                      setImagePreview(next ? null : savedImage);
                    }}
                  >
                    {removeSaved ? t('catalog.callCardImageUndo') : t('catalog.callCardImageRemove')}
                  </button>
                ) : null}
              </div>
              <input type="hidden" name="removeCardImage" value={removeSaved ? '1' : ''} />
            </div>

            <Input
              label={t('catalog.callCardFieldTitle')}
              hint={t('catalog.callCardFieldTitleHint', { count: cardTitle.length, max: TITLE_MAX })}
              name="cardTitle"
              value={cardTitle}
              maxLength={TITLE_MAX}
              onChange={(e) => setCardTitle(e.target.value)}
            />
            <TextArea
              label={t('catalog.callCardFieldSummary')}
              hint={t('catalog.callCardFieldSummaryHint', { count: cardSummary.length, max: SUMMARY_MAX })}
              name="cardSummary"
              rows={3}
              value={cardSummary}
              maxLength={SUMMARY_MAX}
              onChange={(e) => setCardSummary(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
              {t('catalog.callCardPreview')}
            </p>
            <div className="overflow-hidden rounded-[16px] border border-cac-line bg-white shadow-[0_10px_28px_rgba(10,36,64,.08)]">
              <div className="h-32 overflow-hidden bg-gradient-to-br from-[#b8d7bf] to-[#dce9d3]">
                {previewImage ? <img src={previewImage} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="p-3.5">
                <p className="line-clamp-2 text-pequena font-bold text-cac-navy">{previewTitle}</p>
                <p className="mt-1 line-clamp-3 text-mini leading-[1.35] text-cac-muted">{previewSummary}</p>
              </div>
            </div>
            {usingFallback ? (
              <p className="text-mini leading-snug text-cac-muted">{t('catalog.callCardFallback')}</p>
            ) : null}
          </div>
        </div>
      </section>
    </FieldFull>
  );
}
