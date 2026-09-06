import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark, Button, Container } from '@cac/ui';
import { UserRole } from '@cac/shared';
import { brand, urls } from '../../config';
import { normalizeLanguage } from '../../i18n';
import { useAuth } from '../auth/AuthContext';

export function AppShell() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.CURADOR;

  const links: Array<{ to: string; label: string; end?: boolean }> = [
    { to: '/', label: t('nav.dashboard'), end: true },
    { to: '/my/connections', label: t('nav.connections') },
    { to: '/org/representation', label: t('nav.representation') },
    { to: '/catalog/technologies/new', label: t('nav.newTech') },
    { to: '/catalog/challenges/new', label: t('nav.newChallenge') },
    { to: '/funding-offers/new', label: t('nav.newOffer') },
    { to: '/cases/new', label: t('nav.newCase') },
  ];

  if (isStaff) {
    links.push(
      { to: '/admin/curate', label: t('nav.adminCurate') },
      { to: '/admin/representation', label: t('nav.adminRep') },
      { to: '/admin/domains', label: t('nav.adminDomains') },
    );
  }

  return (
    <div className="min-h-screen bg-cac-bg font-sans">
      <header className="sticky top-0 z-50 h-[74px] w-full bg-[rgba(10,36,64,.98)] text-white">
        <Container className="flex h-full items-center gap-5">
          <Link to="/" className="shrink-0">
            <BrandMark
              name={brand.name}
              short={brand.short}
              logoSrc={brand.logo || undefined}
              variant="dark"
            />
          </Link>

          <nav className="hidden flex-1 items-center gap-[3px] overflow-auto lg:flex" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-[9px] text-[11px] whitespace-nowrap text-[#dbe8ec] hover:bg-white/[0.08] ${
                    isActive ? 'bg-white/[0.08]' : ''
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-[7px]">
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

      <nav
        className="flex gap-1 overflow-auto border-b border-cac-line bg-white px-[22px] py-2 lg:hidden"
        aria-label="Mobile"
      >
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-2.5 py-2 text-[11px] whitespace-nowrap ${
                isActive ? 'bg-cac-green3 font-black text-cac-navy' : 'text-cac-muted'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
        <a
          href={urls.www}
          className="shrink-0 rounded-lg px-2.5 py-2 text-[11px] whitespace-nowrap text-cac-muted"
        >
          {t('shell.portal')}
        </a>
      </nav>

      <Container className="py-8">
        <Outlet />
      </Container>
    </div>
  );
}
