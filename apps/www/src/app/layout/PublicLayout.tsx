import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@cac/ui';
import { brand, urls } from '../../config';
import { usePortalAuth } from '../auth/PortalAuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { SiteFooter } from './SiteFooter';

/** Conteúdo centralizado — classes no app para o Tailwind escanear. */
const shell = 'mx-auto w-full max-w-[1220px] px-[22px]';

const btnBase =
  'inline-flex items-center justify-center rounded-[10px] px-[14px] py-[11px] text-pequena font-extrabold whitespace-nowrap transition';

const navLinkClass =
  'rounded-lg px-2.5 py-[9px] text-pequena whitespace-nowrap text-[#dbe8ec] hover:bg-white/[0.08]';

function displayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function PublicLayout() {
  const { t } = useTranslation();
  const { user, loading } = usePortalAuth();
  const location = useLocation();

  const desktopLinks = [
    { to: '/search', label: t('nav.search') },
    { to: '/funding', label: t('nav.funding') },
    { to: '/challenge', label: t('nav.challenge') },
    { to: '/offer', label: t('nav.offer') },
    { to: '/cases', label: t('nav.cases') },
  ];

  const aboutActive = location.pathname === '/' && location.hash === '#sobre';

  const mobileLinks = [
    { to: '/', label: t('nav.home'), icon: '⌂' },
    { to: '/search', label: t('nav.search'), icon: '⌕' },
    { to: '/challenge', label: t('nav.challenge'), icon: '＋' },
    { to: '/cases', label: t('nav.cases'), icon: '◆' },
  ];

  const name = user ? displayName(user.name) : '';

  return (
    <div className="flex min-h-screen flex-col bg-cac-bg pb-14 font-sans md:pb-0">
      <header className="sticky top-0 z-50 h-[74px] w-full bg-[rgba(10,36,64,.98)] text-white">
        <div className={`${shell} flex h-full items-center gap-5`}>
          <NavLink to="/" className="shrink-0">
            <BrandMark
              name={brand.name}
              short={brand.short}
              logoSrc={brand.logo || undefined}
              variant="dark"
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
            <Link
              to="/#sobre"
              className={`${navLinkClass} ${aboutActive ? 'bg-white/[0.08]' : ''}`}
            >
              {t('nav.about')}
            </Link>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-[10px]">
            <LanguageSwitcher />

            {!loading && user && name ? (
              <>
                <a
                  href={urls.web}
                  className="hidden min-w-0 max-w-[180px] flex-col items-end leading-tight text-right sm:flex"
                  title={user.name}
                >
                  <span className="truncate text-pequena font-semibold text-white">{name}</span>
                  <span className="text-mini font-medium tracking-wide text-[#90d6b6]">
                    {t(`roles.${user.role}`, { defaultValue: user.role })}
                  </span>
                </a>
                <span
                  className="hidden h-7 w-px shrink-0 bg-[rgba(255,255,255,.28)] sm:block"
                  aria-hidden
                />
                <a
                  href={urls.web}
                  className={`${btnBase} bg-cac-green2 text-white hover:brightness-105`}
                >
                  {t('nav.panel')}
                </a>
              </>
            ) : (
              <>
                <a
                  href={`${urls.web}/login`}
                  className={`${btnBase} border border-[rgba(255,255,255,.22)] bg-transparent text-white hover:bg-white/10`}
                >
                  {t('nav.signIn')}
                </a>
                <a
                  href={`${urls.web}/register`}
                  className={`${btnBase} bg-cac-green2 text-white hover:brightness-105 max-[620px]:hidden`}
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
