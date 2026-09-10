import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_LANGUAGES, normalizeLanguage, type AppLanguage } from '../../i18n';

type Props = {
  className?: string;
  buttonClassName?: string;
};

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 8"
      className={`size-2.5 transition ${open ? 'rotate-180' : ''}`}
      fill="none"
      aria-hidden
    >
      <path
        d="M1.5 1.5 6 6l4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LanguageSwitcher({
  className = '',
  buttonClassName = 'px-2.5 py-1 text-mini',
}: Props) {
  const { t, i18n } = useTranslation();
  const current = normalizeLanguage(i18n.language);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

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

  function select(lng: AppLanguage) {
    if (lng !== current) void i18n.changeLanguage(lng);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t('lang.switcher')}
        className={`${buttonClassName} flex min-w-[2.75rem] flex-col items-center gap-0.5 rounded-md bg-white/15 font-bold tracking-[1px] text-[#90d6b6] transition hover:bg-white/20`}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{t(`lang.${current}`)}</span>
        <ChevronDown open={open} />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('lang.switcher')}
          className="absolute top-full right-0 z-50 mt-1 min-w-full overflow-hidden rounded-[10px] border border-white/20 bg-cac-navy py-1 shadow-cac"
        >
          {APP_LANGUAGES.map((lng) => {
            const active = lng === current;
            return (
              <li key={lng} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`flex w-full px-3 py-1.5 text-left text-pequena font-bold tracking-[1px] transition ${
                    active
                      ? 'bg-white/15 text-[#90d6b6]'
                      : 'text-[#dbe8ec] hover:bg-white/10 hover:text-[#90d6b6]'
                  }`}
                  onClick={() => select(lng)}
                >
                  {t(`lang.${lng}`)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
