import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark, Button, Container } from '@cac/ui';
import { brand, urls } from '../../config';
import { normalizeLanguage } from '../../i18n';

export function AuthLayout() {
  const { i18n, t } = useTranslation();

  return (
    <div className="min-h-screen bg-cac-bg font-sans">
      <header className="sticky top-0 z-50 h-[74px] w-full bg-[rgba(10,36,64,.98)] text-white">
        <Container className="flex h-full items-center gap-5">
          <a href={urls.www} className="shrink-0">
            <BrandMark
              name={brand.name}
              short={brand.short}
              logoSrc={brand.logo || undefined}
              variant="dark"
            />
          </a>

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
          </div>
        </Container>
      </header>

      <main className="py-10">
        <Container className="max-w-md">
          <Outlet />
        </Container>
      </main>
    </div>
  );
}
