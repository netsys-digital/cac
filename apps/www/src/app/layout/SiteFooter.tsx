import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@cac/ui';
import { brand, urls } from '../../config';

const shell = 'mx-auto w-full max-w-[1220px] px-[22px]';

const linkClass =
  'block py-1 text-mini leading-snug text-[#cddae0] transition hover:text-[#8ed5b5]';

const headingClass = 'mt-0 mb-2.5 text-mini font-bold tracking-wide text-white';

type FooterLink =
  | { to: string; label: string }
  | { href: string; label: string };

function SocialIcon({ label, href, children }: { label: string; href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="grid size-8 place-items-center rounded-full border border-white/15 text-[#cddae0] transition hover:border-[#8ed5b5] hover:text-[#8ed5b5]"
    >
      {children}
    </a>
  );
}

function FooterNavList({ items }: { items: FooterLink[] }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.label}>
          {'to' in item ? (
            <Link to={item.to} className={linkClass}>
              {item.label}
            </Link>
          ) : (
            <a href={item.href} className={linkClass}>
              {item.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function SiteFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const explore: FooterLink[] = [
    { to: '/search', label: t('footer.links.search') },
    { to: '/funding', label: t('footer.links.funding') },
    { to: '/challenge', label: t('footer.links.challenges') },
    { to: '/cases', label: t('footer.links.cases') },
  ];

  const about: FooterLink[] = [
    { to: '/#sobre', label: t('footer.links.aboutCac') },
    { to: '/#parceiros', label: t('footer.links.partners') },
    { to: '/#noticias', label: t('footer.links.news') },
    { to: '/#contato', label: t('footer.links.contact') },
  ];

  const participate: FooterLink[] = [
    { to: '/challenge', label: t('footer.links.challenge') },
    { to: '/offer', label: t('footer.links.offer') },
    { href: `${urls.web}/register`, label: t('footer.links.register') },
    { href: urls.web, label: t('footer.links.panel') },
  ];

  return (
    <footer className="mt-auto w-full border-t border-white/10 bg-[rgba(10,36,64,.98)] text-[#cddae0]">
      <div className={`${shell} pt-10 pb-8 md:pb-10`}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.45fr_repeat(4,minmax(0,1fr))] lg:gap-0">
          <div className="sm:col-span-2 lg:col-span-1 lg:pr-5">
            <BrandMark
              name={brand.name}
              short={brand.short}
              logoSrc={brand.logo || undefined}
              variant="dark"
            />
            <p className="mt-3 max-w-[380px] text-mini leading-relaxed text-[#cddae0]">
              {t('footer.blurb')}
            </p>
          </div>

          <div className="lg:border-l lg:border-white/15 lg:px-5">
            <h4 className={headingClass}>{t('footer.explore')}</h4>
            <FooterNavList items={explore} />
          </div>

          <div className="lg:border-l lg:border-white/15 lg:px-5">
            <h4 className={headingClass}>{t('footer.about')}</h4>
            <FooterNavList items={about} />
          </div>

          <div className="lg:border-l lg:border-white/15 lg:px-5">
            <h4 className={headingClass}>{t('footer.participate')}</h4>
            <FooterNavList items={participate} />
          </div>

          <div className="lg:border-l lg:border-white/15 lg:pl-5">
            <h4 className={headingClass}>{t('footer.follow')}</h4>
            <div className="flex flex-wrap gap-2">
              <SocialIcon label="LinkedIn" href="https://www.linkedin.com">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                  <path d="M6.5 8.5H3.7V20h2.8V8.5ZM5.1 4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2ZM20.3 20h-2.8v-5.6c0-1.5-.5-2.5-1.8-2.5-1 0-1.5.7-1.8 1.3-.1.3-.1.6-.1.9V20H11v-11h2.7v1.5c.4-.7 1.3-1.7 3.1-1.7 2.3 0 4 1.5 4 4.8V20Z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="YouTube" href="https://www.youtube.com">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                  <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.2V8.8L15.5 12 10 15.2Z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="Instagram" href="https://www.instagram.com">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                  <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm6.1-8.2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 3.5c-2.3 0-2.6 0-3.5.1-2.3.1-4.2 2-4.3 4.3-.1.9-.1 1.2-.1 3.5s0 2.6.1 3.5c.1 2.3 2 4.2 4.3 4.3.9.1 1.2.1 3.5.1s2.6 0 3.5-.1c2.3-.1 4.2-2 4.3-4.3.1-.9.1-1.2.1-3.5s0-2.6-.1-3.5c-.1-2.3-2-4.2-4.3-4.3-.9-.1-1.2-.1-3.5-.1Zm0 1.7c2.2 0 2.5 0 3.4.1 1.6.1 2.8 1.3 2.9 2.9.1.9.1 1.1.1 3.3s0 2.4-.1 3.3c-.1 1.6-1.3 2.8-2.9 2.9-.9.1-1.1.1-3.4.1s-2.5 0-3.4-.1c-1.6-.1-2.8-1.3-2.9-2.9-.1-.9-.1-1.1-.1-3.3s0-2.4.1-3.3c.1-1.6 1.3-2.8 2.9-2.9.9-.1 1.2-.1 3.4-.1Z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="X" href="https://x.com">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                  <path d="M17.6 3.5h2.7l-5.9 6.8L22 20.5h-5.8l-4.5-5.9-5.2 5.9H3.8l6.3-7.2L2.2 3.5h6l4.1 5.4 5.3-5.4Zm-1 15.3h1.5L7.5 5h-1.6l10.7 13.8Z" />
                </svg>
              </SocialIcon>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div
          className={`${shell} flex flex-col gap-2 py-4 pb-[4.5rem] text-[12px] leading-snug text-[#9eb0b8] md:pb-4 sm:flex-row sm:items-center sm:justify-between`}
        >
          <p>{t('footer.copyright', { year, brand: brand.name })}</p>
          <p className="sm:text-right">{t('footer.legal')}</p>
        </div>
      </div>
    </footer>
  );
}
