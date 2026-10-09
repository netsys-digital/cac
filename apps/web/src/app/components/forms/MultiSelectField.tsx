import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type MultiSelectOption = { value: string; label: string };

type Props = {
  label: string;
  hint?: string;
  /** Campo hidden com os valores separados por ", ". */
  name: string;
  options: MultiSelectOption[];
  defaultValue?: string[];
  placeholder?: string;
};

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 12 8" className={`size-2.5 shrink-0 transition ${open ? 'rotate-180' : ''}`} fill="none" aria-hidden>
      <path d="M1.5 1.5 6 6l4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Combo de múltipla escolha com checkboxes, filtro e "selecionar todos". */
export function MultiSelectField({ label, hint, name, options, defaultValue = [], placeholder }: Props) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultValue.filter((v) => options.some((o) => o.value === v))),
  );

  const allSelected = selected.size === options.length && options.length > 0;
  const someSelected = selected.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected, open]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [filter, options]);

  const ordered = options.filter((o) => selected.has(o.value)).map((o) => o.value);

  function toggle(value: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(options.map((o) => o.value)));
  }

  const summary = allSelected
    ? t('catalog.multiSelectAllSelected', { count: options.length })
    : ordered.length === 0
      ? null
      : ordered.length <= 4
        ? ordered.join(', ')
        : `${ordered.slice(0, 4).join(', ')} +${ordered.length - 4}`;

  return (
    <div ref={rootRef} className="relative flex w-full flex-col gap-1">
      <span className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">{label}</span>
      {hint ? <span className="text-mini leading-snug text-cac-muted">{hint}</span> : null}
      <input type="hidden" name={name} value={ordered.join(', ')} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-2.5 py-2 text-left text-pequena outline-none transition focus:ring-2 focus:ring-cac-green2/40 ${
          open ? 'border-cac-green/50 ring-2 ring-cac-green2/30' : 'border-cac-line'
        }`}
      >
        <span className={`min-w-0 truncate ${summary ? 'text-cac-navy' : 'text-cac-muted'}`}>
          {summary ?? placeholder ?? t('catalog.multiSelectPlaceholder')}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-cac-navy">
          {ordered.length && !allSelected ? (
            <span className="rounded-full bg-cac-green3 px-1.5 py-0.5 text-[0.65rem] font-extrabold text-cac-green">
              {ordered.length}
            </span>
          ) : null}
          <ChevronDown open={open} />
        </span>
      </button>

      {open ? (
        <div className="absolute top-full right-0 left-0 z-40 mt-1 overflow-hidden rounded-[12px] border border-cac-line bg-white shadow-[0_16px_40px_rgba(10,36,64,.16)]">
          <div className="border-b border-cac-line p-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t('catalog.multiSelectFilter')}
              className="w-full rounded-md border border-cac-line bg-[#fbfcfb] px-2 py-1.5 text-pequena text-cac-navy outline-none focus:ring-2 focus:ring-cac-green2/40"
              autoFocus
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 border-b border-cac-line bg-[#f6faf8] px-3 py-2 text-pequena font-bold text-cac-navy hover:bg-cac-green3/60">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="size-4 shrink-0 accent-cac-green"
            />
            {t('catalog.multiSelectAll')}
            <span className="ml-auto text-mini font-semibold text-cac-muted">
              {selected.size}/{options.length}
            </span>
          </label>
          <ul id={listId} role="listbox" aria-multiselectable className="max-h-60 overflow-y-auto py-1">
            {visible.map((option) => {
              const checked = selected.has(option.value);
              return (
                <li key={option.value} role="option" aria-selected={checked}>
                  <label
                    className={`flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-pequena transition ${
                      checked ? 'bg-cac-green3/50 text-cac-navy' : 'text-cac-navy hover:bg-[#f3f6f8]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(option.value)}
                      className="size-4 shrink-0 accent-cac-green"
                    />
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.value !== option.label ? (
                      <span className="text-mini font-bold text-cac-muted">{option.value}</span>
                    ) : null}
                  </label>
                </li>
              );
            })}
            {!visible.length ? (
              <li className="px-3 py-2 text-mini text-cac-muted">{t('catalog.multiSelectEmpty')}</li>
            ) : null}
          </ul>
          <div className="flex items-center justify-between border-t border-cac-line px-3 py-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              disabled={!selected.size}
              className="text-mini font-bold text-cac-muted hover:text-cac-navy disabled:opacity-40"
            >
              {t('catalog.multiSelectClear')}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-cac-green3 px-3 py-1 text-mini font-extrabold text-cac-navy hover:brightness-95"
            >
              {t('catalog.multiSelectDone')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
