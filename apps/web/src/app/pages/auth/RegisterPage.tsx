import { type FormEvent, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { AuthCard } from '../../layout/AuthLayout';

function safeReturnUrl(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = safeReturnUrl(params.get('returnUrl'));
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordHint = useMemo(() => {
    if (password.length === 0) return t('auth.passwordHint');
    if (password.length < 8) return t('auth.passwordWeak');
    return t('auth.passwordOk');
  }, [password, t]);

  if (!loading && user) {
    return (
      <Navigate
        to={returnUrl ?? '/'}
        replace
        state={returnUrl ? { justRegistered: true } : undefined}
      />
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(false);
    try {
      await register(
        String(form.get('name')),
        String(form.get('email')),
        String(form.get('password')),
      );
      if (returnUrl) {
        navigate(returnUrl, { replace: true, state: { justRegistered: true } });
      } else {
        navigate('/', { replace: true });
      }
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      badge={t('auth.signUpBadge')}
      title={t('auth.signUpTitle')}
      subtitle={returnUrl ? t('auth.registerContextual') : t('auth.signUpSubtitle')}
      footer={
        <p className="text-center text-[11px] text-cac-muted">
          {t('auth.haveAccount')}{' '}
          <Link
            to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
            className="font-black text-cac-green hover:underline"
          >
            {t('auth.submitSignIn')}
          </Link>
        </p>
      }
    >
      {returnUrl ? (
        <div className="flex items-start gap-3 rounded-[12px] border border-cac-green/30 bg-cac-green3 px-3 py-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-cac-green2 text-[12px] font-black text-white">
            →
          </span>
          <div>
            <p className="text-[11px] font-black text-cac-navy">{t('auth.contextualTitle')}</p>
            <p className="mt-1 text-[11px] leading-snug text-cac-muted">{t('auth.contextualBody')}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-[12px] border border-cac-line bg-[#fbfcfb] px-3 py-3">
          <p className="text-[10px] font-black tracking-[1px] text-cac-green uppercase">
            {t('auth.nextStepLabel')}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-cac-muted">{t('auth.nextStepBody')}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3.5">
        <Input label={t('auth.name')} name="name" required autoComplete="name" hint={t('auth.nameHint')} />
        <Input
          label={t('auth.email')}
          name="email"
          type="email"
          required
          autoComplete="email"
          hint={t('auth.emailHint')}
        />
        <div className="relative">
          <Input
            label={t('auth.password')}
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            hint={passwordHint}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-16"
          />
          <button
            type="button"
            className="absolute right-2 bottom-[7px] rounded-md px-2 py-1 text-[10px] font-black text-cac-green hover:bg-cac-green3"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
          >
            {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
          </button>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800" role="alert">
            {t('auth.error')}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t('auth.submitting') : t('auth.submitSignUp')}
        </Button>
      </form>
    </AuthCard>
  );
}
