import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSearchReturnHref } from '../search/searchReturn';

export function BackToSearchLink({ className }: { className?: string }) {
  const { t } = useTranslation();
  const href = getSearchReturnHref('/search');

  return (
    <Link
      to={href}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-[10px] border border-white/25 bg-white/10 px-3.5 py-2.5 text-pequena font-bold text-white backdrop-blur-sm transition hover:bg-white/18'
      }
      state={{ restoreSearchScroll: true }}
    >
      <span aria-hidden className="text-media leading-none">
        ←
      </span>
      {t('detail.backSearch')}
    </Link>
  );
}
