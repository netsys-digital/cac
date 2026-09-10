import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark, Container } from '@cac/ui';
import { brand, urls } from '../../config';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

function JourneyHint() {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const isRegister = pathname.startsWith('/register');
  const hasReturn = new URLSearchParams(search).has('returnUrl');

  const steps = [
    { n: '1', label: t('auth.journeyStep1'), active: true },
    { n: '2', label: t('auth.journeyStep2'), active: false },
    { n: '3', label: t('auth.journeyStep3'), active: false },
  ];

  return (
    <aside className="hidden h-full flex-col justify-between rounded-[19px] border border-white/10 bg-[rgba(10,36,64,.92)] p-6 text-white lg:flex">
      <div>
        <p className="text-mini font-extrabold tracking-[1.7px] text-[#90d6b6] uppercase">
          {t('auth.journeyBadge')}
        </p>
        <h2 className="mt-3 text-grande leading-tight font-bold">
          {isRegister ? t('auth.journeyRegisterTitle') : t('auth.journeyLoginTitle')}
        </h2>
        <p className="mt-3 text-pequena leading-relaxed text-[#c5d5dc]">
          {hasReturn ? t('auth.journeyContextualBody') : t('auth.journeyBody')}
        </p>

        <ol className="mt-6 space-y-3">
          {steps.map((step) => (
            <li
              key={step.n}
              className={`flex items-start gap-3 rounded-[12px] border px-3 py-3 ${
                step.active
                  ? 'border-[#8ed5b5]/50 bg-white/10'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-pequena font-bold ${
                  step.active ? 'bg-cac-green2 text-white' : 'bg-white/10 text-[#c5d5dc]'
                }`}
              >
                {step.n}
              </span>
              <span className="text-pequena leading-snug text-[#dbe8ec]">{step.label}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 rounded-[12px] border border-dashed border-[#8ed5b5]/40 bg-[#8ed5b5]/10 p-4">
        <p className="text-mini font-extrabold tracking-[1px] text-[#90d6b6] uppercase">
          {t('auth.principleLabel')}
        </p>
        <p className="mt-2 text-pequena leading-snug text-[#dbe8ec]">{t('auth.principle')}</p>
      </div>
    </aside>
  );
}

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-cac-bg font-sans">
      <header className="sticky top-0 z-50 h-[74px] w-full bg-[rgba(10,36,64,.98)] text-white">
        <Container className="flex h-full items-center gap-5">
          <a href={urls.www} className="shrink-0" aria-label={brand.name}>
            <BrandMark
              name={brand.name}
              short={brand.short}
              logoSrc={brand.logo || undefined}
              variant="dark"
            />
          </a>

          <div className="ml-auto flex items-center gap-[7px]">
            <LanguageSwitcher />
          </div>
        </Container>
      </header>

      <main className="py-8 md:py-10">
        <Container className="max-w-5xl">
          <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.85fr)]">
            <div className="min-w-0">
              <Outlet />
            </div>
            <JourneyHint />
          </div>
        </Container>
      </main>
    </div>
  );
}

export function AuthCard({
  badge,
  title,
  subtitle,
  children,
  footer,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[19px] border border-cac-line bg-white shadow-cac">
      <div className="border-b border-cac-line bg-[#edf1f3] px-5 py-2 font-mono text-mini text-[#76838a]">
        climateactionconnect · {badge ?? 'auth'}
      </div>
      <div className="space-y-5 p-5 md:p-6">
        <header>
          <h1 className="text-grande leading-tight font-bold text-cac-navy">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-pequena leading-relaxed text-cac-muted">{subtitle}</p>
          ) : null}
        </header>
        {children}
        {footer ? <div className="border-t border-cac-line pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
