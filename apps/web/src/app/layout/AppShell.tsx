import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BrandMark, Button, Container } from '@cac/ui';
import { UserRole } from '@cac/shared';
import { brand, urls } from '../../config';
import { normalizeLanguage } from '../../i18n';
import { useAuth } from '../auth/AuthContext';
import { SideNav, sideIcons, type SideNavItem } from './SideNav';

type NavItem = { to: string; label: string; end?: boolean };

function primaryLinkClass(isActive: boolean) {
  return `rounded-lg px-2.5 py-[9px] text-[11px] whitespace-nowrap text-[#dbe8ec] hover:bg-white/[0.08] ${
    isActive ? 'bg-white/[0.08]' : ''
  }`;
}

function useBreadcrumbs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return useMemo(() => {
    const home = { to: '/', label: t('nav.dashboard') };
    const map: Array<{ match: RegExp | string; label: string }> = [
      { match: /^\/my\/contents/, label: t('nav.myContents') },
      { match: /^\/my\/connections/, label: t('nav.connections') },
      { match: /^\/org\/representation/, label: t('nav.representation') },
      { match: /^\/catalog\/technologies\/[^/]+\/edit/, label: t('mine.edit') },
      { match: /^\/catalog\/technologies/, label: t('nav.newTech') },
      { match: /^\/catalog\/challenges\/[^/]+\/edit/, label: t('mine.edit') },
      { match: /^\/catalog\/challenges/, label: t('nav.newChallenge') },
      { match: /^\/funding-offers\/[^/]+\/edit/, label: t('mine.edit') },
      { match: /^\/funding-offers/, label: t('nav.newOffer') },
      { match: /^\/cases\/[^/]+\/edit/, label: t('mine.edit') },
      { match: /^\/cases/, label: t('nav.newCase') },
      { match: /^\/connections/, label: t('nav.connections') },
      { match: /^\/admin\/curate/, label: t('nav.adminCurate') },
      { match: /^\/admin\/representation/, label: t('nav.adminRep') },
      { match: /^\/admin\/domains/, label: t('nav.adminDomains') },
    ];

    if (pathname === '/' || pathname === '') return [home];

    const hit = map.find((m) =>
      typeof m.match === 'string' ? pathname.startsWith(m.match) : m.match.test(pathname),
    );
    return hit ? [home, { to: pathname, label: hit.label }] : [home, { to: pathname, label: t('shell.breadcrumbPage') }];
  }, [pathname, t]);
}

export function AppShell() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.CURADOR;
  const crumbs = useBreadcrumbs();

  const primary: NavItem[] = [
    { to: '/', label: t('nav.dashboard'), end: true },
    { to: '/my/connections', label: t('nav.connections') },
    { to: '/org/representation', label: t('nav.representation') },
  ];

  const sideItems: SideNavItem[] = [
    { to: '/my/contents', label: t('nav.myContents'), icon: sideIcons.mine },
    { to: '/catalog/technologies/new', label: t('nav.newTech'), icon: sideIcons.tech },
    { to: '/catalog/challenges/new', label: t('nav.newChallenge'), icon: sideIcons.challenge },
    { to: '/funding-offers/new', label: t('nav.newOffer'), icon: sideIcons.offer },
    { to: '/cases/new', label: t('nav.newCase'), icon: sideIcons.case },
    ...(isStaff
      ? [
          { to: '/admin/curate', label: t('nav.adminCurate'), icon: sideIcons.curate },
          { to: '/admin/representation', label: t('nav.adminRep'), icon: sideIcons.adminRep },
          { to: '/admin/domains', label: t('nav.adminDomains'), icon: sideIcons.domains },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-cac-bg font-sans">
      <header className="sticky top-0 z-50 w-full bg-[rgba(10,36,64,.98)] text-white">
        <Container className="flex h-[74px] items-center gap-5">
          <Link to="/" className="shrink-0">
            <BrandMark
              name={brand.name}
              short={brand.short}
              logoSrc={brand.logo || undefined}
              variant="dark"
            />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center gap-[3px] lg:flex" aria-label="Primary">
            {primary.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => primaryLinkClass(isActive)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-[7px]">
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-[10px] font-black tracking-[1px] text-[#90d6b6] hover:bg-white/10"
              onClick={() => {
                const next = normalizeLanguage(i18n.language) === 'pt' ? 'en' : 'pt';
                void i18n.changeLanguage(next);
              }}
            >
              {normalizeLanguage(i18n.language) === 'pt' ? t('lang.en') : t('lang.pt')}
            </button>
            <a href={urls.www} className="hidden sm:inline-flex">
              <Button variant="ghostDark">{t('shell.portal')}</Button>
            </a>
            <Button variant="ghostDark" onClick={() => void logout()}>
              {t('shell.signOut')}
            </Button>
          </div>
        </Container>
      </header>

      {/* Breadcrumb full-width: separa header da sidebar */}
      <div className="sticky top-[74px] z-40 border-b border-cac-line bg-white">
        <div className="flex h-11 items-center gap-2 px-4 text-[11px] md:px-6">
          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1.5 font-mono text-[#76838a]">
            <span className="hidden text-cac-muted sm:inline">{t('shell.breadcrumbRoot')}</span>
            <span className="hidden text-cac-line sm:inline">·</span>
            {crumbs.map((c, i) => (
              <span key={`${c.to}-${c.label}`} className="flex items-center gap-1.5">
                {i > 0 ? <span className="text-cac-line">/</span> : null}
                {i < crumbs.length - 1 ? (
                  <Link to={c.to} className="truncate text-cac-muted hover:text-cac-navy">
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate font-black text-cac-navy">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
          <nav className="ml-auto flex flex-wrap items-center gap-1 lg:hidden" aria-label="Mobile primary">
            {primary.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-lg px-2 py-1 text-[10px] font-black ${
                    isActive ? 'bg-cac-green3 text-cac-navy' : 'text-cac-muted'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-74px-44px)]">
        <SideNav items={sideItems} />
        <div className="min-w-0 flex-1 px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
