import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BrandMark, Button } from '@cac/ui';
import { brand, urls } from '../../config';
import { normalizeLanguage } from '../../i18n';
import { useAuth } from '../auth/AuthContext';
import { useRepresentation } from '../auth/RepresentationContext';
import { useStaffTasks } from '../auth/StaffTasksContext';
import { SideNav, sideIcons, type SideNavItem } from './SideNav';

type NavItem = { to: string; label: string; end?: boolean; badge?: string };

function primaryLinkClass(isActive: boolean) {
  return `rounded-xl px-4 py-2.5 text-[14px] font-semibold whitespace-nowrap text-[#dbe8ec] hover:bg-white/[0.1] ${
    isActive ? 'bg-white/[0.12] text-white shadow-[inset_0_-2px_0_0_#8ed5b5]' : ''
  }`;
}

function useBreadcrumbs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return useMemo(() => {
    const home = { to: '/', label: t('nav.dashboard') };
    const map: Array<{ match: RegExp | string; label: string }> = [
      { match: /^\/welcome/, label: t('nav.dashboard') },
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
  const { canPublish, gate, isStaff } = useRepresentation();
  const { contentCount, repCount } = useStaffTasks();
  const crumbs = useBreadcrumbs();

  const displayName = (() => {
    const parts = (user?.name ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1]}`;
  })();

  const primary: NavItem[] = isStaff
    ? [
        { to: '/', label: t('nav.dashboard'), end: true },
        {
          to: '/admin/curate',
          label: t('nav.adminCurate'),
          badge: contentCount > 0 ? String(contentCount) : undefined,
        },
        {
          to: '/admin/representation',
          label: t('nav.adminRep'),
          badge: repCount > 0 ? String(repCount) : undefined,
        },
        { to: '/admin/domains', label: t('nav.adminDomains') },
        { to: '/my/connections', label: t('nav.connections') },
      ]
    : [
        { to: '/', label: t('nav.dashboard'), end: true },
        { to: '/my/connections', label: t('nav.connections') },
        { to: '/org/representation', label: t('nav.representation') },
      ];

  const pendingBadge = gate === 'pending' ? t('onboarding.pendingBadge') : undefined;
  const lockedHint = !canPublish ? t('nav.publishLocked') : undefined;

  const publishItems: SideNavItem[] = [
    {
      to: '/my/contents',
      label: t('nav.myContents'),
      icon: sideIcons.mine,
      badge: !canPublish ? t('nav.lockedShort') : undefined,
      lockTitle: lockedHint,
    },
    {
      to: '/catalog/technologies/new',
      label: t('nav.newTech'),
      icon: sideIcons.tech,
      badge: !canPublish ? t('nav.lockedShort') : undefined,
      lockTitle: lockedHint,
    },
    {
      to: '/catalog/challenges/new',
      label: t('nav.newChallenge'),
      icon: sideIcons.challenge,
      badge: !canPublish ? t('nav.lockedShort') : undefined,
      lockTitle: lockedHint,
    },
    {
      to: '/funding-offers/new',
      label: t('nav.newOffer'),
      icon: sideIcons.offer,
      badge: !canPublish ? t('nav.lockedShort') : undefined,
      lockTitle: lockedHint,
    },
    {
      to: '/cases/new',
      label: t('nav.newCase'),
      icon: sideIcons.case,
      badge: !canPublish ? t('nav.lockedShort') : undefined,
      lockTitle: lockedHint,
    },
  ];

  const staffItems: SideNavItem[] = isStaff
    ? [
        {
          to: '/admin/curate',
          label: t('nav.adminCurate'),
          icon: sideIcons.curate,
          badge: contentCount > 0 ? t('nav.tasksBadge', { count: contentCount }) : undefined,
          count: contentCount,
        },
        {
          to: '/admin/representation',
          label: t('nav.adminRep'),
          icon: sideIcons.adminRep,
          badge: repCount > 0 ? t('nav.tasksBadge', { count: repCount }) : undefined,
          count: repCount,
        },
        { to: '/admin/domains', label: t('nav.adminDomains'), icon: sideIcons.domains },
      ]
    : [];

  const sideItems: SideNavItem[] = [
    { to: urls.www, label: t('nav.backPortal'), icon: sideIcons.portal },
    ...staffItems,
    { to: '/my/connections', label: t('nav.connections'), icon: sideIcons.connections },
    ...(isStaff
      ? []
      : [
          {
            to: '/org/representation',
            label: t('nav.representation'),
            icon: sideIcons.representation,
            badge: pendingBadge,
          } satisfies SideNavItem,
          ...publishItems,
        ]),
  ];

  return (
    <div className="min-h-screen bg-cac-bg font-sans">
      <header className="sticky top-0 z-50 w-full bg-[rgba(10,36,64,.98)] text-white">
        <div className="flex h-[92px] w-full items-center gap-6 px-5 lg:gap-8 md:px-7">
          <Link to="/" className="mr-auto shrink-0 lg:mr-0">
            <BrandMark
              name={brand.name}
              short={brand.short}
              logoSrc={brand.logo || undefined}
              variant="dark"
            />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center gap-2 lg:flex" aria-label="Primary">
            {primary.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => primaryLinkClass(isActive)}
              >
                <span className="inline-flex items-center gap-2">
                  {link.label}
                  {link.badge ? (
                    <span className="grid min-w-5 place-items-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-cac-navy">
                      {link.badge}
                    </span>
                  ) : null}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-[12px] font-black tracking-[1px] text-[#90d6b6] hover:bg-white/10"
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
            {displayName ? (
              <>
                <Link
                  to="/"
                  className="hidden min-w-0 max-w-[200px] flex-col items-end leading-tight text-right sm:flex"
                  title={user?.name}
                >
                  <span className="truncate text-sm font-semibold text-white">{displayName}</span>
                  <span className="text-xs font-medium tracking-wide text-[#90d6b6]">
                    {user?.role ? t(`roles.${user.role}`) : t('shell.profile')}
                  </span>
                </Link>
                <span
                  className="hidden h-8 w-px shrink-0 bg-[rgba(255,255,255,.28)] sm:block"
                  aria-hidden
                />
              </>
            ) : null}
            <Button variant="ghostDark" onClick={() => void logout()}>
              {t('shell.signOut')}
            </Button>
          </div>
        </div>
      </header>

      <div className="sticky top-[92px] z-40 border-b border-cac-line bg-white">
        <div className="flex h-12 items-center gap-2 px-5 text-[13px] md:px-7">
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
          <nav className="ml-auto flex flex-wrap items-center gap-1.5 lg:hidden" aria-label="Mobile primary">
            {primary.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-black ${
                    isActive ? 'bg-cac-green3 text-cac-navy' : 'text-cac-muted'
                  }`
                }
              >
                {link.label}
                {link.badge ? (
                  <span className="rounded-full bg-amber-400 px-1.5 text-[10px] text-cac-navy">
                    {link.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-92px-48px)]">
        <SideNav items={sideItems} />
        <div className="min-w-0 flex-1 px-4 py-4 md:px-6 md:py-5 xl:px-8 xl:py-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
