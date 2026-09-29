import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveMediaUrl } from './RepresentativeImageField';

export const PUBLICATION_MAX_BYTES = 8 * 1024 * 1024;

export type ExistingPublication = {
  id: string;
  url: string;
  filename: string;
};

/** PDFs novos selecionados (campo `publications`). */
export function pickPublicationFiles(form: FormData): File[] {
  return form
    .getAll('publications')
    .filter((v): v is File => v instanceof File && v.size > 0);
}

/** IDs de PDFs já enviados marcados para remoção (campo `removePublication`). */
export function pickRemovedPublications(form: FormData): string[] {
  return form.getAll('removePublication').map(String).filter(Boolean);
}

type Props = {
  existing?: ExistingPublication[];
};

export function PublicationsField({ existing = [] }: Props) {
  const { t } = useTranslation();
  const inputId = useId();
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string[]>([]);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  function toggleRemoved(id: string) {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleFiles(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    const invalid = files.find((f) => f.type !== 'application/pdf' || f.size > PUBLICATION_MAX_BYTES);
    if (invalid) {
      setErrorKey(invalid.type !== 'application/pdf' ? 'catalog.publicationsBadType' : 'catalog.publicationsTooLarge');
      input.value = '';
      setSelected([]);
      return;
    }
    setErrorKey(null);
    setSelected(files.map((f) => f.name));
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
        {t('catalog.publications')}
      </label>
      <p className="text-mini leading-snug text-cac-muted">{t('catalog.publicationsHint')}</p>

      {existing.length ? (
        <ul className="space-y-1.5">
          {existing.map((pub) => {
            const isRemoved = removed.has(pub.id);
            return (
              <li
                key={pub.id}
                className={`flex items-center gap-2 rounded-lg border border-cac-line px-3 py-2 text-pequena ${
                  isRemoved ? 'bg-red-50 text-cac-muted line-through' : 'bg-white text-cac-navy'
                }`}
              >
                <span className="shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-[0.65rem] font-extrabold text-red-700">
                  PDF
                </span>
                <a
                  href={resolveMediaUrl(pub.url) ?? pub.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate font-bold hover:underline"
                >
                  {pub.filename}
                </a>
                {isRemoved ? <input type="hidden" name="removePublication" value={pub.id} /> : null}
                <button
                  type="button"
                  onClick={() => toggleRemoved(pub.id)}
                  className="shrink-0 text-mini font-bold text-cac-green no-underline hover:underline"
                >
                  {isRemoved ? t('catalog.publicationsUndo') : t('catalog.publicationsRemove')}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <input
        id={inputId}
        name="publications"
        type="file"
        accept="application/pdf"
        multiple
        className="max-w-full text-pequena text-cac-navy file:mr-3 file:rounded-[10px] file:border-0 file:bg-cac-green3 file:px-3 file:py-2 file:text-pequena file:font-extrabold file:text-cac-navy hover:file:brightness-95"
        onChange={(e) => handleFiles(e.target)}
      />
      {selected.length ? (
        <ul className="space-y-0.5 text-mini text-cac-muted">
          {selected.map((name) => (
            <li key={name}>+ {name}</li>
          ))}
        </ul>
      ) : null}
      {errorKey ? <p className="text-mini text-red-700">{t(errorKey)}</p> : null}
    </div>
  );
}
