import { useTranslation } from 'react-i18next';
import { APP_LANGUAGES, normalizeLanguage } from '../../i18n';

type Props = {
  className?: string;
  /** Classes do botão individual (tamanho tipográfico do header). */
  buttonClassName?: string;
};

export function LanguageSwitcher({
  className = '',
  buttonClassName = 'px-2 py-1 text-[10px]',
}: Props) {
  const { t, i18n } = useTranslation();
  const current = normalizeLanguage(i18n.language);

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      {APP_LANGUAGES.map((lng) => {
        const active = lng === current;
        return (
          <button
            key={lng}
            type="button"
            aria-pressed={active}
            className={`${buttonClassName} rounded-md font-black tracking-[1px] transition ${
              active
                ? 'bg-white/15 text-[#90d6b6]'
                : 'text-[#dbe8ec]/70 hover:bg-white/10 hover:text-[#90d6b6]'
            }`}
            onClick={() => {
              if (!active) void i18n.changeLanguage(lng);
            }}
          >
            {t(`lang.${lng}`)}
          </button>
        );
      })}
    </div>
  );
}
