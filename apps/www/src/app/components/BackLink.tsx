import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNavigationOrigin } from '../search/navigationOrigin';
import { getSearchReturnHref } from '../search/searchReturn';

const DEFAULT_CLASS =
  'inline-flex items-center gap-2 rounded-[10px] border border-white/25 bg-white/10 px-3.5 py-2.5 text-pequena font-bold text-white backdrop-blur-sm transition hover:bg-white/18';

function labelKeyFor(origin: string | null): string {
  if (!origin) return 'detail.backSearch';
  const path = origin.split('?')[0];
  if (path.startsWith('/search')) return 'detail.backSearch';
  if (path === '/' || path === '') return 'detail.backHome';
  return 'detail.back';
}

/**
 * Volta para a página de origem (histórico, preservando URL e filtros). Sem origem interna
 * (acesso direto / nova aba), leva à última busca salva.
 */
export function BackLink({ className = DEFAULT_CLASS, showArrow = true }: { className?: string; showArrow?: boolean }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const origin = getNavigationOrigin(location.key);
  const content: ReactNode = (
    <>
      {showArrow ? (
        <span aria-hidden className="text-media leading-none">
          ←
        </span>
      ) : null}
      {t(labelKeyFor(origin))}
    </>
  );

  if (origin) {
    return (
      <button
        type="button"
        onClick={() => navigate(-1)}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to={getSearchReturnHref('/search')} className={className} state={{ restoreSearchScroll: true }}>
      {content}
    </Link>
  );
}
