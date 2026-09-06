import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark, Button, Container } from '@cac/ui';
import { UserRole } from '@cac/shared';
import { brand, urls } from '../../config';
import { normalizeLanguage } from '../../i18n';
import { useAuth } from '../auth/AuthContext';

type NavItem = { to: string; label: string; end?: boolean };

function linkClass(isActive: boolean, tone: 'dark' | 'light') {
  if (tone === 'dark') {
    return `rounded-lg px-2.5 py-[9px] text-[11px] whitespace-nowrap text-[#dbe8ec] hover:bg-white/[0.08] ${
      isActive ? 'bg-white/[0.08]' : ''
    }`;
  }
  return `rounded-lg px-2.5 py-1.5 text-[11px] whitespace-nowrap ${
    isActive ? 'bg-cac-green3 font-black text-cac-navy' : 'text-cac-muted hover:bg-cac-green3/50'
  }`;
}

export function AppShell() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.CURADOR;

  const primary: NavItem[] = [
    { to: '/', label: t('nav.dashboard'), end: true },
    { to: '/my/connections', label: t('nav.connections') },
    { to: '/org/representation', label: t('nav.representation') },
  ];

  const create: NavItem[] = [
    { to: '/catalog/technologies/new', label: t('nav.newTech') },
    { to: '/catalog/challenges/new', label: t('nav.newChallenge') },
    { to: '/funding-offers/new', label: t('nav.newOffer') },
    { to: '/cases/new', label: t('nav.newCase') },
  ];

  const admin: NavItem[] = isStaff
    ? [
        { to: '/admin/curate', label: t('nav.adminCurate') },
        { to: '/admin/representation', label: t('nav.adminRep') },
        { to: '/admin/domains', label: t('nav.adminDomains') },
      ]
    : [];

  const secondary = [...create, ...admin];

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
                className={({ isActive }) => linkClass(isActive, 'dark')}
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

      {/* Ações de criar + admin: wrap, sem scrollbar */}
      <div className="border-b border-cac-line bg-white">
        <Container className="flex flex-wrap items-center gap-1 py-2">
          <nav className="flex flex-wrap items-center gap-1" aria-label="Actions">
            {secondary.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => linkClass(isActive, 'light')}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <nav className="flex flex-wrap items-center gap-1 lg:hidden" aria-label="Mobile primary">
            {primary.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => linkClass(isActive, 'light')}
              >
                {link.label}
              </NavLink>
            ))}
            <a
              href={urls.www}
              className="rounded-lg px-2.5 py-1.5 text-[11px] whitespace-nowrap text-cac-muted sm:hidden"
            >
              {t('shell.portal')}
            </a>
          </nav>
        </Container>
      </div>

      <Container className="py-8">
        <Outlet />
      </Container>
    </div>
  );
}
