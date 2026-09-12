import type { FormEventHandler, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';

type Tip = { title: string; body: string };

type FormTab = { id: string; label: string };

type FormPageProps = {
  badge: string;
  title: string;
  description: string;
  tips: Tip[];
  children?: ReactNode;
  /** Painéis por aba — mantidos montados (hidden) para preservar FormData. */
  panels?: Record<string, ReactNode>;
  tabs?: FormTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitLabel: string;
  submitHint?: string;
  error?: string;
  message?: string;
  submitting?: boolean;
};

export function FormPage({
  badge,
  title,
  description,
  tips,
  children,
  panels,
  tabs,
  activeTab,
  onTabChange,
  onSubmit,
  submitLabel,
  submitHint,
  error,
  message,
  submitting,
}: FormPageProps) {
  const { t } = useTranslation();
  const usePanels = Boolean(panels && tabs?.length);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">{badge}</p>
          <h1 className="mt-2 text-grande leading-tight font-bold text-cac-navy">{title}</h1>
          <p className="mt-2 max-w-[760px] text-pequena leading-relaxed text-cac-muted">{description}</p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <form
          onSubmit={onSubmit}
          className="overflow-hidden rounded-[19px] border border-cac-line bg-white shadow-cac"
        >
          <div className="space-y-4 p-5 md:p-6">
            {tabs?.length ? (
              <div className="flex gap-1 border-b border-cac-line pb-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange?.(tab.id)}
                    className={`-mb-px border-b-2 px-3 py-2 text-pequena font-bold transition ${
                      activeTab === tab.id
                        ? 'border-cac-green text-cac-navy'
                        : 'border-transparent text-cac-muted hover:text-cac-navy'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null}

            {usePanels ? (
              Object.entries(panels!).map(([id, node]) => (
                <div
                  key={id}
                  className={`grid gap-x-4 gap-y-3 sm:grid-cols-2 ${activeTab !== id ? 'hidden' : ''}`}
                >
                  {node}
                </div>
              ))
            ) : (
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
            )}

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-800">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-lg border border-cac-green/30 bg-cac-green3 px-3 py-2 text-pequena text-cac-navy">
                {message}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 border-t border-cac-line pt-4">
              <Button type="submit" disabled={submitting}>
                {submitLabel}
              </Button>
              <p className="text-mini text-cac-muted">{submitHint ?? t('form.submitHint')}</p>
            </div>
          </div>
        </form>

        <aside className="space-y-3">
          <div className="rounded-[16px] border border-cac-line bg-white p-4 shadow-cac">
            <p className="text-mini font-extrabold tracking-[1px] text-cac-green uppercase">
              {t('form.tipsTitle')}
            </p>
            <ul className="mt-3 space-y-3">
              {tips.map((tip) => (
                <li key={tip.title} className="rounded-[12px] border border-cac-line bg-[#fbfcfb] p-3">
                  <strong className="block text-pequena text-cac-navy">{tip.title}</strong>
                  <span className="mt-1 block text-mini leading-snug text-cac-muted">{tip.body}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[16px] border border-dashed border-cac-green/40 bg-cac-green3/40 p-4">
            <p className="text-pequena font-bold text-cac-navy">{t('form.flowTitle')}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-mini leading-snug text-cac-muted">
              <li>{t('form.flow1')}</li>
              <li>{t('form.flow2')}</li>
              <li>{t('form.flow3')}</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

type FieldProps = {
  className?: string;
  children: ReactNode;
};

export function FieldFull({ children, className = '' }: FieldProps) {
  return <div className={`sm:col-span-2 ${className}`}>{children}</div>;
}

type SelectFieldProps = {
  label: string;
  hint?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
};

export function SelectField({
  label,
  hint,
  name,
  required,
  disabled,
  value,
  defaultValue,
  onChange,
  children,
}: SelectFieldProps) {
  const controlled = value !== undefined;
  return (
    <label className="flex w-full flex-col gap-1">
      <span className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
        {label}
      </span>
      {hint ? <span className="text-mini leading-snug text-cac-muted">{hint}</span> : null}
      <select
        name={name}
        required={required}
        disabled={disabled}
        {...(controlled ? { value } : { defaultValue })}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full rounded-lg border border-cac-line bg-white px-2.5 py-2 text-pequena text-cac-navy outline-none focus:ring-2 focus:ring-cac-green2/40 disabled:cursor-not-allowed disabled:bg-[#edf1f3] disabled:text-cac-muted"
      >
        {children}
      </select>
    </label>
  );
}
