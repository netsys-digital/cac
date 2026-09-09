import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@cac/ui';
import { brand, urls } from '../../config';

/** Mesmo eixo do header — max 1220px + padding lateral. */
const shell = 'mx-auto w-full max-w-[1220px] px-[22px]';

export function SiteFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const explore = [
    { to: '/search', label: t('footer.links.search') },
    { to: '/funding', label: t('footer.links.funding') },
    { to: '/cases', label: t('footer.links.cases') },
  ];

  const participate = [
    { to: '/challenge', label: t('footer.links.challenge') },
    { to: '/offer', label: t('footer.links.offer') },
    { href: `${urls.web}/register`, label: t('footer.links.register') },
    { href: urls.web, label: t('footer.links.panel') },
  ];

  return (
    <footer className="mt-auto w-full border-t border-white/10 bg-[rgba(10,36,64,.98)] text-[#cddae0]">
      <div className={`${shell} py-12 pb-20 md:pb-12`}>
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr] md:gap-[22px]">
          <div>
            <BrandMark
              name={brand.name}
              short={brand.short}
              logoSrc={brand.logo || undefined}
              variant="dark"
            />
            <p className="mt-2 text-[10px] font-black tracking-[0.14em] text-[#8ed5b5] uppercase">
              {t('footer.tagline')}
            </p>
            <p className="mt-3 max-w-[420px] text-[11px] leading-relaxed text-[#cddae0]">
              {t('footer.blurb')}
            </p>
            <p className="mt-4 text-[10px] leading-relaxed text-[#9eb0b8]">{t('footer.trust')}</p>
          </div>

          <div>
            <h4 className="mt-0 mb-3 text-[12px] font-black text-white">{t('footer.explore')}</h4>
            <ul className="space-y-0.5">
              {explore.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="block py-1 text-[11px] text-[#cddae0] transition hover:text-[#8ed5b5]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mt-0 mb-3 text-[12px] font-black text-white">{t('footer.participate')}</h4>
            <ul className="space-y-0.5">
              {participate.map((item) => (
                <li key={item.label}>
                  {'to' in item && item.to ? (
                    <Link
                      to={item.to}
                      className="block py-1 text-[11px] text-[#cddae0] transition hover:text-[#8ed5b5]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={'href' in item ? item.href : undefined}
                      className="block py-1 text-[11px] text-[#cddae0] transition hover:text-[#8ed5b5]"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 text-[10px] text-[#9eb0b8] sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer.copyright', { year, brand: brand.name })}</p>
          <p className="sm:text-right">{t('footer.meta')}</p>
        </div>
      </div>
    </footer>
  );
}
