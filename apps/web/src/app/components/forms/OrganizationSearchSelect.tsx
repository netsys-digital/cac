import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

export type OrgOption = {
  id: string;
  name: string;
  country?: string | null;
  region?: string | null;
};

type Props = {
  label: string;
  hint?: string;
  options: OrgOption[];
  value: string;
  onChange: (organizationId: string) => void;
  required?: boolean;
};

/** Campo de pesquisa + seleção de organização (combobox). */
export function OrganizationSearchSelect({
  label,
  hint,
  options,
  value,
  onChange,
  required,
}: Props) {
  const { t } = useTranslation();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) ?? null;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    if (selected) setQuery(selected.name);
  }, [selected?.id, selected?.name]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 40);
    return options
      .filter((o) => {
        const hay = `${o.name} ${o.country ?? ''} ${o.region ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [options, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  function pick(org: OrgOption) {
    onChange(org.id);
    setQuery(org.name);
    setOpen(false);
  }

  function clearSelection() {
    onChange('');
    setQuery('');
    setOpen(true);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[highlight];
      if (item) pick(item);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative flex w-full flex-col gap-1">
      <span className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
        {label}
        {required ? ' *' : null}
      </span>
      {hint ? <span className="text-mini leading-snug text-cac-muted">{hint}</span> : null}
      <div className="relative">
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder={t('rep.searchOrgPlaceholder')}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(true);
            if (selected && next !== selected.name) onChange('');
          }}
          onKeyDown={onKeyDown}
          className="w-full rounded-lg border border-cac-line bg-white py-2 pr-16 pl-2.5 text-pequena text-cac-navy outline-none focus:ring-2 focus:ring-cac-green2/40"
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          {value || query ? (
            <button
              type="button"
              className="rounded-md px-2 py-1 text-mini font-bold text-cac-muted hover:bg-[#edf1f3] hover:text-cac-navy"
              onClick={clearSelection}
              aria-label={t('rep.clearOrg')}
            >
              ×
            </button>
          ) : null}
          <span className="px-1.5 text-cac-muted" aria-hidden>
            ▾
          </span>
        </div>
      </div>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+4px)] z-20 max-h-56 w-full overflow-auto rounded-lg border border-cac-line bg-white py-1 shadow-[0_12px_28px_rgba(10,36,64,.12)]"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-pequena text-cac-muted">{t('rep.searchOrgEmpty')}</li>
          ) : (
            filtered.map((org, index) => {
              const active = org.id === value;
              const focused = index === highlight;
              return (
                <li key={org.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={`flex w-full flex-col items-start px-3 py-2 text-left transition ${
                      focused || active ? 'bg-cac-green3/60' : 'hover:bg-[#f7faf8]'
                    }`}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => pick(org)}
                  >
                    <span className="text-pequena font-bold text-cac-navy">{org.name}</span>
                    {org.country || org.region ? (
                      <span className="text-mini text-cac-muted">
                        {[org.country, org.region].filter(Boolean).join(' · ')}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
