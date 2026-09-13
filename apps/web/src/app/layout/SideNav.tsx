import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export type SideNavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  /** When true, item is visible but not actionable (educates about the gate). */
  locked?: boolean;
  lockTitle?: string;
  badge?: string;
  /** Numeric count shown on the icon when the rail is collapsed. */
  count?: number;
  /** Destaque visual (ex.: link ao portal público). */
  tone?: 'default' | 'portal';
};

function IconBulb() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 18h6M10 21h4" strokeLinecap="round" />
      <path d="M12 3a6 6 0 0 0-3.5 10.7c.6.5 1 1.2 1.1 2h4.8c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18" strokeLinecap="round" />
      <path d="M12 8c-2-3.5-6-3-6-1s2 2.5 6 1Zm0 0c2-3.5 6-3 6-1s-2 2.5-6 1Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="m12 3 2.6 5.7 6.2.7-4.6 4.2 1.3 6.1L12 16.9 6.5 19.7l1.3-6.1L3.2 9.4l6.2-.7L12 3Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5M14 14.2c2 .3 3.7 1.5 4.5 3.8" strokeLinecap="round" />
    </svg>
  );
}

function IconList() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9Z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.7 5.23" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.8 13.12a5 5 0 0 0 7.07 7.07L13.3 18.77" strokeLinecap="round" />
    </svg>
  );
}

function IconBadge() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 14.5 8.5 20.5 9.3 16 13.4 17.2 19.3 12 16.5 6.8 19.3 8 13.4 3.5 9.3 9.5 8.5 12 3Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 20 7v5c0 5-3.5 8.5-8 9.5C7.5 20.5 4 17 4 12V7l8-4Z" strokeLinejoin="round" />
      <path d="M9.5 12.2 11.2 14l3.4-3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20h16M6 20V8l6-4 6 4v12" strokeLinejoin="round" />
      <path d="M9 20v-5h6v5M10 11h.01M14 11h.01M10 14h.01M14 14h.01" strokeLinecap="round" />
    </svg>
  );
}

export const sideIcons = {
  home: <IconHome />,
  mine: <IconList />,
  tech: <IconBulb />,
  challenge: <IconAlert />,
  offer: <IconGift />,
  case: <IconFolder />,
  curate: <IconStar />,
  adminRep: <IconUsers />,
  domains: <IconGrid />,
  orgs: <IconBuilding />,
  users: <IconShield />,
  portal: <IconGlobe />,
  connections: <IconLink />,
  favorites: <IconStar />,
  representation: <IconBadge />,
};

type SideNavProps = {
  items: SideNavItem[];
};

export function SideNav({ items }: SideNavProps) {
  return (
    <aside
      className="group/side sticky top-[118px] z-30 flex h-[calc(100vh-118px)] w-[64px] shrink-0 flex-col gap-1.5 overflow-hidden border-r border-cac-line bg-[rgba(10,36,64,.98)] py-3 transition-[width] duration-200 ease-out hover:w-[220px]"
      aria-label="Secondary"
    >
      {items.map((item) => {
        if (item.locked) {
          return (
            <div
              key={item.to}
              title={item.lockTitle ?? item.label}
              className="mx-2 flex cursor-not-allowed items-center gap-3 rounded-[10px] border-t-2 border-transparent px-2.5 py-2.5 text-pequena font-bold text-[#7a8f9a] opacity-70"
              aria-disabled
            >
              <span className="flex size-8 shrink-0 items-center justify-center">{item.icon}</span>
              <span className="flex max-w-0 flex-col overflow-hidden opacity-0 transition-all duration-200 group-hover/side:max-w-[140px] group-hover/side:opacity-100">
                <span className="whitespace-nowrap">{item.label}</span>
                {item.badge ? (
                  <span className="mt-0.5 whitespace-nowrap text-mini font-bold tracking-wide text-amber-300/90">
                    {item.badge}
                  </span>
                ) : null}
              </span>
            </div>
          );
        }

        const isExternal = item.to.startsWith('http');
        const portalTone = item.tone === 'portal';
        if (isExternal) {
          return (
            <a
              key={item.to}
              href={item.to}
              title={item.label}
              className={[
                'mx-2 flex items-center gap-3 rounded-[10px] border-t-2 px-2.5 py-2.5 text-pequena font-bold transition',
                portalTone
                  ? 'border-cac-green/50 bg-cac-green3/15 text-[#8ed5b5] hover:bg-cac-green3/25 hover:text-white'
                  : 'border-transparent text-[#c5d5dc] hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              <span className="flex size-8 shrink-0 items-center justify-center">{item.icon}</span>
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/side:max-w-[140px] group-hover/side:opacity-100">
                {item.label}
              </span>
            </a>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.lockTitle ?? item.label}
            className={({ isActive }) =>
              [
                'mx-2 flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-pequena font-bold transition',
                isActive
                  ? 'border-t-2 border-cac-green2 bg-white text-cac-navy shadow-[0_6px_16px_rgba(0,0,0,.12)]'
                  : 'border-t-2 border-transparent text-[#c5d5dc] hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative flex size-8 shrink-0 items-center justify-center">
                  {item.icon}
                  {item.count && item.count > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 grid min-w-[1.1rem] place-items-center rounded-full bg-amber-400 px-1 text-mini font-bold leading-none text-cac-navy">
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  ) : null}
                </span>
                <span className="flex max-w-0 flex-col overflow-hidden opacity-0 transition-all duration-200 group-hover/side:max-w-[140px] group-hover/side:opacity-100">
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={`mt-0.5 whitespace-nowrap text-mini font-bold tracking-wide ${
                        isActive ? 'text-amber-700' : 'text-amber-300/90'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </aside>
  );
}
