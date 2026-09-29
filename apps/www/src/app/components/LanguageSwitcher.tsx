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
  buttonClassName = 'h-9 px-2.5 text-mini',
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
        className={`${buttonClassName} flex items-center justify-center gap-1.5 rounded-[10px] border font-extrabold tracking-[1px] transition ${
          open
            ? 'border-[#90d6b6]/45 bg-white/10 text-white'
            : 'border-white/15 bg-white/[0.06] text-[#dbe8ec] hover:border-white/25 hover:bg-white/10 hover:text-white'
        }`}
        onClick={() => setOpen((v) => !v)}
      >
        <i className="fa-solid fa-globe text-[0.8rem] text-[#90d6b6]" aria-hidden />
        <span>{t(`lang.${current}`)}</span>
        <ChevronDown open={open} />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('lang.switcher')}
          className="absolute top-full right-0 z-50 mt-2 min-w-[7rem] overflow-hidden rounded-[12px] border border-white/15 bg-cac-navy p-1 shadow-[0_16px_40px_rgba(0,0,0,.35)]"
        >
          {APP_LANGUAGES.map((lng) => {
            const active = lng === current;
            return (
              <li key={lng} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-1.5 text-left text-pequena font-bold tracking-[1px] transition ${
                    active
                      ? 'bg-white/10 text-[#90d6b6]'
                      : 'text-[#dbe8ec] hover:bg-white/[0.07] hover:text-white'
                  }`}
                  onClick={() => select(lng)}
                >
                  {t(`lang.${lng}`)}
                  {active ? <i className="fa-solid fa-check text-[0.7rem]" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
