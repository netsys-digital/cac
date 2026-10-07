import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import {
  catalogApi,
  type Attachment,
  type AttachmentKind,
  type AttachmentMeta,
  type CallCardKind,
} from '../../api/catalogApi';
import { resolveMediaUrl } from './RepresentativeImageField';

export const GALLERY_MAX = 20;
export const GALLERY_MAX_BYTES = 8 * 1024 * 1024;
export const DOCUMENTS_MAX = 10;
export const DOCUMENTS_MAX_BYTES = 20 * 1024 * 1024;
export const ATTACHMENT_TITLE_MAX = 200;
export const ATTACHMENT_DESCRIPTION_MAX = 500;

const GALLERY_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf', 'txt', 'csv'];
const DOCUMENT_ACCEPT = DOCUMENT_EXTENSIONS.map((ext) => `.${ext}`).join(',');

type FieldConfig = {
  kind: AttachmentKind;
  listKey: keyof PublicationAttachments;
  filesName: string;
  removeName: string;
  /** Prefixo dos campos de título/descrição (`<prefix>NewTitle`, `<prefix>Title:<id>`…). */
  metaPrefix: string;
  max: number;
  maxBytes: number;
  accept: string;
  isValid: (file: File) => boolean;
};

const CONFIG: Record<AttachmentKind, FieldConfig> = {
  GALLERY: {
    kind: 'GALLERY',
    listKey: 'gallery',
    filesName: 'galleryFiles',
    removeName: 'removeGallery',
    metaPrefix: 'gallery',
    max: GALLERY_MAX,
    maxBytes: GALLERY_MAX_BYTES,
    accept: GALLERY_ACCEPT,
    isValid: (file) => GALLERY_ACCEPT.split(',').includes(file.type),
  },
  DOCUMENT: {
    kind: 'DOCUMENT',
    listKey: 'documents',
    filesName: 'documentFiles',
    removeName: 'removeDocument',
    metaPrefix: 'document',
    max: DOCUMENTS_MAX,
    maxBytes: DOCUMENTS_MAX_BYTES,
    accept: DOCUMENT_ACCEPT,
    isValid: (file) => DOCUMENT_EXTENSIONS.includes(fileExtension(file.name)),
  },
};

export type PublicationAttachments = {
  gallery: Attachment[];
  documents: Attachment[];
};

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1).replace('.0', '')} MB`;
}

const metaNames = (prefix: string) => ({
  newTitle: `${prefix}NewTitle`,
  newDescription: `${prefix}NewDescription`,
  title: (id: string) => `${prefix}Title:${id}`,
  description: (id: string) => `${prefix}Description:${id}`,
});

function formText(form: FormData, name: string): string | null {
  const value = form.get(name);
  return value === null ? null : String(value).trim();
}

/**
 * Depois que a publicação foi salva: remove os anexos marcados, atualiza título/descrição
 * dos que ficaram e envia os novos com seus textos.
 */
export async function saveAttachments(
  token: string,
  kind: CallCardKind,
  id: string,
  form: FormData,
  existing?: PublicationAttachments,
) {
  for (const config of Object.values(CONFIG)) {
    const names = metaNames(config.metaPrefix);
    const removed = new Set(form.getAll(config.removeName).map(String).filter(Boolean));
    for (const attachmentId of removed) {
      await catalogApi.deleteAttachment(token, kind, id, attachmentId);
    }

    for (const item of existing?.[config.listKey] ?? []) {
      if (removed.has(item.id)) continue;
      const title = formText(form, names.title(item.id));
      const description = formText(form, names.description(item.id));
      if (title === null || description === null) continue;
      if (title !== (item.title ?? '') || description !== (item.description ?? '')) {
        await catalogApi.updateAttachment(token, kind, id, item.id, { title, description });
      }
    }

    // Arquivos e textos novos ficam alinhados pela ordem em que aparecem no formulário.
    const files = form.getAll(config.filesName).filter((v): v is File => v instanceof File && v.name !== '');
    const titles = form.getAll(names.newTitle).map((v) => String(v).trim());
    const descriptions = form.getAll(names.newDescription).map((v) => String(v).trim());
    for (const [index, file] of files.entries()) {
      const meta: AttachmentMeta = { title: titles[index] ?? '', description: descriptions[index] ?? '' };
      await catalogApi.uploadAttachment(token, kind, id, config.kind, file, meta);
    }
  }
}

/** Carrega galeria e documentos já salvos de uma publicação (páginas de edição). */
export function usePublicationAttachments(token: string | null | undefined, kind: CallCardKind, id: string) {
  const [attachments, setAttachments] = useState<PublicationAttachments>({ gallery: [], documents: [] });

  const reload = useCallback(async () => {
    if (!token || !id) return;
    try {
      setAttachments(await catalogApi.listAttachments(token, kind, id));
    } catch {
      setAttachments({ gallery: [], documents: [] });
    }
  }, [token, kind, id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { attachments, reload };
}

type MetaFieldsProps = {
  idBase: string;
  titleName: string;
  descriptionName: string;
  defaultTitle?: string | null;
  defaultDescription?: string | null;
  placeholder: string;
  disabled?: boolean;
};

function MetaFields({
  idBase,
  titleName,
  descriptionName,
  defaultTitle,
  defaultDescription,
  placeholder,
  disabled,
}: MetaFieldsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <Input
        id={`${idBase}-title`}
        label={t('catalog.attachmentTitle')}
        name={titleName}
        defaultValue={defaultTitle ?? ''}
        maxLength={ATTACHMENT_TITLE_MAX}
        placeholder={placeholder}
        disabled={disabled}
        className="py-1.5"
      />
      <TextArea
        id={`${idBase}-description`}
        label={t('catalog.attachmentDescription')}
        name={descriptionName}
        defaultValue={defaultDescription ?? ''}
        maxLength={ATTACHMENT_DESCRIPTION_MAX}
        rows={2}
        placeholder={t('catalog.attachmentDescriptionPlaceholder', { max: ATTACHMENT_DESCRIPTION_MAX })}
        disabled={disabled}
        className="min-h-[60px] py-1.5"
      />
    </div>
  );
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

type PendingFile = { key: string; file: File; preview: string | null };

type Props = {
  kind: AttachmentKind;
  existing?: Attachment[];
};

/** Seleção acumulativa de arquivos: o input visível adiciona, o input oculto carrega a lista no FormData. */
function AttachmentsField({ kind, existing = [] }: Props) {
  const { t } = useTranslation();
  const config = CONFIG[kind];
  const names = metaNames(config.metaPrefix);
  const isGallery = kind === 'GALLERY';
  const pickerId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const existingKey = existing.map((item) => item.id).join(',');
  useEffect(() => {
    setRemoved(new Set());
    setPending((prev) => {
      prev.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
      return [];
    });
  }, [existingKey]);

  useEffect(() => {
    const input = filesRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    pending.forEach((item) => transfer.items.add(item.file));
    input.files = transfer.files;
  }, [pending]);

  useEffect(() => {
    const form = rootRef.current?.closest('form');
    if (!form) return;
    const onReset = () => {
      setPending((prev) => {
        prev.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
        return [];
      });
      setRemoved(new Set());
      setError(null);
    };
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, []);

  const keptCount = existing.filter((item) => !removed.has(item.id)).length;
  const total = keptCount + pending.length;
  const remaining = Math.max(0, config.max - total);

  function addFiles(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;
    const invalid = files.find((file) => !config.isValid(file));
    if (invalid) {
      setError(t('catalog.attachmentsBadType', { name: invalid.name }));
      return;
    }
    const tooLarge = files.find((file) => file.size > config.maxBytes);
    if (tooLarge) {
      setError(t('catalog.attachmentsTooLarge', { name: tooLarge.name, size: formatBytes(config.maxBytes) }));
      return;
    }
    const accepted = files.slice(0, remaining);
    setError(files.length > remaining ? t('catalog.attachmentsLimit', { max: config.max }) : null);
    if (!accepted.length) return;
    setPending((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: isGallery ? URL.createObjectURL(file) : null,
      })),
    ]);
  }

  function dropPending(key: string) {
    setPending((prev) => {
      const item = prev.find((p) => p.key === key);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.key !== key);
    });
    setError(null);
  }

  function toggleRemoved(id: string) {
    const restoring = removed.has(id);
    if (restoring && total >= config.max) {
      setError(t('catalog.attachmentsLimit', { max: config.max }));
      return;
    }
    const next = new Set(removed);
    if (restoring) next.delete(id);
    else next.add(id);
    setRemoved(next);
  }

  const actionClass = 'shrink-0 text-mini font-bold text-cac-green no-underline hover:underline';
  const emptyClass =
    'rounded-[12px] border border-dashed border-cac-green/40 bg-white/70 px-3 py-6 text-center text-mini text-cac-muted';

  return (
    <div ref={rootRef} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <label
            htmlFor={pickerId}
            className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted"
          >
            {t(isGallery ? 'catalog.galleryTitle' : 'catalog.documentsTitle')}
          </label>
          <p className="mt-1 text-mini leading-snug text-cac-muted">
            {t(isGallery ? 'catalog.galleryHint' : 'catalog.documentsHint', {
              max: config.max,
              size: formatBytes(config.maxBytes),
            })}
          </p>
          <p className="mt-0.5 text-mini leading-snug text-cac-muted">{t('catalog.attachmentMetaHint')}</p>
        </div>
        <span className="rounded-full border border-cac-green/30 bg-white px-2.5 py-1 text-mini font-extrabold text-cac-navy">
          {t('catalog.attachmentsCount', { count: total, max: config.max })}
        </span>
      </div>

      {isGallery ? (
        existing.length || pending.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {existing.map((item) => {
              const isRemoved = removed.has(item.id);
              return (
                <li
                  key={item.id}
                  className={`overflow-hidden rounded-[12px] border bg-white ${
                    isRemoved ? 'border-red-200 opacity-60' : 'border-cac-line'
                  }`}
                >
                  <div className="aspect-[4/3] bg-[#edf1f3]">
                    <img src={resolveMediaUrl(item.url) ?? item.url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-2 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-mini text-cac-muted">{item.filename}</span>
                      <button type="button" onClick={() => toggleRemoved(item.id)} className={actionClass}>
                        {isRemoved ? t('catalog.publicationsUndo') : t('catalog.publicationsRemove')}
                      </button>
                    </div>
                    <MetaFields
                      idBase={`att-${item.id}`}
                      titleName={names.title(item.id)}
                      descriptionName={names.description(item.id)}
                      defaultTitle={item.title}
                      defaultDescription={item.description}
                      placeholder={t('catalog.attachmentTitlePlaceholder')}
                      disabled={isRemoved}
                    />
                  </div>
                  {isRemoved ? <input type="hidden" name={config.removeName} value={item.id} /> : null}
                </li>
              );
            })}
            {pending.map((item) => (
              <li key={item.key} className="overflow-hidden rounded-[12px] border border-cac-green/40 bg-white">
                <div className="relative aspect-[4/3] bg-[#edf1f3]">
                  {item.preview ? <img src={item.preview} alt="" className="h-full w-full object-cover" /> : null}
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-cac-green px-2 py-0.5 text-[0.65rem] font-extrabold text-white">
                    {t('catalog.attachmentsNew')}
                  </span>
                </div>
                <div className="space-y-2 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-mini text-cac-muted">{item.file.name}</span>
                    <button type="button" onClick={() => dropPending(item.key)} className={actionClass}>
                      {t('catalog.publicationsRemove')}
                    </button>
                  </div>
                  <MetaFields
                    idBase={`att-${item.key}`}
                    titleName={names.newTitle}
                    descriptionName={names.newDescription}
                    placeholder={t('catalog.attachmentTitlePlaceholder')}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={emptyClass}>{t('catalog.galleryEmpty')}</p>
        )
      ) : existing.length || pending.length ? (
        <ul className="space-y-2.5">
          {existing.map((item) => {
            const isRemoved = removed.has(item.id);
            return (
              <li
                key={item.id}
                className={`rounded-[12px] border p-3 ${
                  isRemoved ? 'border-red-200 bg-red-50/60 opacity-70' : 'border-cac-line bg-white'
                }`}
              >
                <div className="flex items-center gap-2 text-pequena text-cac-navy">
                  <span className="shrink-0 rounded bg-cac-green3 px-1.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-cac-navy">
                    {fileExtension(item.filename) || 'doc'}
                  </span>
                  <a
                    href={resolveMediaUrl(item.url) ?? item.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`min-w-0 flex-1 truncate font-bold hover:underline ${isRemoved ? 'line-through' : ''}`}
                  >
                    {item.filename}
                  </a>
                  <span className="shrink-0 text-mini text-cac-muted">{formatBytes(item.size)}</span>
                  <button type="button" onClick={() => toggleRemoved(item.id)} className={actionClass}>
                    {isRemoved ? t('catalog.publicationsUndo') : t('catalog.publicationsRemove')}
                  </button>
                </div>
                <div className="mt-2.5">
                  <MetaFields
                    idBase={`att-${item.id}`}
                    titleName={names.title(item.id)}
                    descriptionName={names.description(item.id)}
                    defaultTitle={item.title}
                    defaultDescription={item.description}
                    placeholder={stripExtension(item.filename)}
                    disabled={isRemoved}
                  />
                </div>
                {isRemoved ? <input type="hidden" name={config.removeName} value={item.id} /> : null}
              </li>
            );
          })}
          {pending.map((item) => (
            <li key={item.key} className="rounded-[12px] border border-cac-green/40 bg-white p-3">
              <div className="flex items-center gap-2 text-pequena text-cac-navy">
                <span className="shrink-0 rounded bg-cac-green px-1.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-white">
                  {fileExtension(item.file.name) || 'doc'}
                </span>
                <span className="min-w-0 flex-1 truncate font-bold">{item.file.name}</span>
                <span className="shrink-0 text-mini text-cac-muted">{formatBytes(item.file.size)}</span>
                <button type="button" onClick={() => dropPending(item.key)} className={actionClass}>
                  {t('catalog.publicationsRemove')}
                </button>
              </div>
              <div className="mt-2.5">
                <MetaFields
                  idBase={`att-${item.key}`}
                  titleName={names.newTitle}
                  descriptionName={names.newDescription}
                  placeholder={stripExtension(item.file.name)}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={emptyClass}>{t('catalog.documentsEmpty')}</p>
      )}

      <input
        id={pickerId}
        type="file"
        accept={config.accept}
        multiple
        disabled={remaining === 0}
        className="max-w-full text-pequena text-cac-navy file:mr-3 file:rounded-[10px] file:border-0 file:bg-cac-green3 file:px-3 file:py-2 file:text-pequena file:font-extrabold file:text-cac-navy hover:file:brightness-95 disabled:opacity-50"
        onChange={(e) => addFiles(e.target)}
      />
      <input ref={filesRef} type="file" name={config.filesName} multiple hidden tabIndex={-1} aria-hidden />
      {error ? <p className="text-mini text-red-700">{error}</p> : null}
    </div>
  );
}

export function GalleryField({ existing }: { existing?: Attachment[] }) {
  return <AttachmentsField kind="GALLERY" existing={existing} />;
}

export function DocumentsField({ existing }: { existing?: Attachment[] }) {
  return <AttachmentsField kind="DOCUMENT" existing={existing} />;
}
