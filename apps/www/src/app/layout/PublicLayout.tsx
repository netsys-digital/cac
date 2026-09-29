import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@cac/ui';
import { brand, urls } from '../../config';
import { usePortalAuth } from '../auth/PortalAuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTrackNavigationOrigin } from '../search/navigationOrigin';
import { SiteFooter } from './SiteFooter';

/** Conteúdo centralizado — classes no app para o Tailwind escanear. */
const shell = 'mx-auto w-full max-w-[1220px] px-[22px]';

const btnBase =
  'inline-flex h-9 items-center justify-center gap-2 rounded-[10px] px-3.5 text-mini font-extrabold whitespace-nowrap transition';

const navLinkClass =
  'rounded-lg px-2 py-1.5 text-mini whitespace-nowrap text-[#dbe8ec] hover:bg-white/[0.08]';

function displayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

export function PublicLayout() {
  const { t } = useTranslation();
  const { user, loading } = usePortalAuth();
  const location = useLocation();
  useTrackNavigationOrigin();

  const desktopLinks = [
    { to: '/sobre', label: t('nav.about') },
    { to: '/funding', label: t('nav.funding') },
    { to: '/challenge', label: t('nav.challenge') },
    { to: '/offer', label: t('nav.offer') },
    { to: '/cases', label: t('nav.cases') },
  ];

  const mobileLinks = [
    { to: '/sobre', label: t('nav.about'), icon: 'ℹ' },
    { to: '/funding', label: t('nav.funding'), icon: '◎' },
    { to: '/challenge', label: t('nav.challenge'), icon: '＋' },
    { to: '/cases', label: t('nav.cases'), icon: '◆' },
  ];

  const name = user ? displayName(user.name) : '';
  const portalReturn = `${urls.www}${location.pathname}${location.search}${location.hash}`;
  const signInHref = `${urls.web}/login?returnUrl=${encodeURIComponent(portalReturn)}`;
  const signUpHref = `${urls.web}/register?returnUrl=${encodeURIComponent(portalReturn)}`;

  return (
    <div className="flex min-h-screen flex-col bg-cac-bg pb-14 font-sans md:pb-0">
      <header className="sticky top-0 z-50 h-[72px] w-full bg-cac-navy text-white">
        <div className={`${shell} flex h-full items-center gap-5`}>
          <NavLink
            to="/"
            className="flex h-full shrink-0 items-center"
            aria-label={brand.name}
          >
            <BrandMark
              name={brand.name}
              short={brand.short}
              logoSrc={brand.logo || undefined}
              variant="dark"
              size="header"
            />
          </NavLink>

          <nav
            className="hidden min-w-0 flex-1 items-center gap-[3px] overflow-x-auto lg:flex"
            aria-label="Primary"
          >
            {desktopLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? 'bg-white/[0.08]' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <LanguageSwitcher />

            {!loading && user && name ? (
              <>
                <a
                  href={urls.web}
                  className="hidden h-9 min-w-0 max-w-[220px] items-center gap-2.5 rounded-[10px] py-1 pr-3 pl-1 transition hover:bg-white/[0.07] sm:flex"
                  title={user.name}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#2e9e6b,#1a4d4a)] text-[0.7rem] font-extrabold tracking-wide text-white ring-2 ring-[#90d6b6]/30"
                    aria-hidden
                  >
                    {initials(user.name)}
                  </span>
                  <span className="flex min-w-0 flex-col leading-[1.15]">
                    <span className="truncate text-mini font-bold text-white">{name}</span>
                    <span className="truncate text-[0.68rem] font-semibold tracking-[0.3px] text-[#90d6b6]">
                      {t(`roles.${user.role}`, { defaultValue: user.role })}
                    </span>
                  </span>
                </a>
                <a
                  href={urls.web}
                  className={`${btnBase} bg-cac-green2 text-white shadow-[0_4px_14px_rgba(46,158,107,.35)] hover:brightness-110`}
                >
                  <i className="fa-solid fa-table-columns text-[0.8rem]" aria-hidden />
                  {t('nav.panel')}
                </a>
              </>
            ) : (
              <>
                <a
                  href={signInHref}
                  className={`${btnBase} border border-white/20 bg-white/[0.04] text-white hover:border-white/30 hover:bg-white/10`}
                >
                  {t('nav.signIn')}
                </a>
                <a
                  href={signUpHref}
                  className={`${btnBase} bg-cac-green2 text-white shadow-[0_4px_14px_rgba(46,158,107,.35)] hover:brightness-110 max-[620px]:hidden`}
                >
                  {t('nav.signUp')}
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />

      <nav
        className="fixed inset-x-0 bottom-0 z-[60] flex justify-around border-t border-cac-line bg-white px-1 py-1.5 shadow-[0_-8px_24px_rgba(10,36,64,.10)] md:hidden"
        aria-label="Mobile"
      >
        {mobileLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-2 py-1 text-center text-mini ${isActive ? 'text-cac-navy' : 'text-cac-muted'}`
            }
          >
            <b className="block text-media text-cac-navy">{link.icon}</b>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
