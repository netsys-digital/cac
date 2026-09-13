import { type FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { AuthCard } from '../../layout/AuthLayout';
import { isExternalReturnUrl, safeReturnUrl } from '../../lib/returnUrl';

function withAccessTokenHash(returnUrl: string, accessToken: string | null) {
  if (!accessToken || !isExternalReturnUrl(returnUrl)) return returnUrl;
  const url = new URL(returnUrl);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  hash.set('cac_at', accessToken);
  url.hash = hash.toString();
  return url.toString();
}

export function LoginPage({ forcedFrom }: { forcedFrom?: string | null }) {
  const { t } = useTranslation();
  const { login, user, loading, ensureAccessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<'credentials' | 'disabled' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo =
    safeReturnUrl(forcedFrom) ||
    safeReturnUrl((location.state as { from?: string } | null)?.from) ||
    '/';
  const isContextual = redirectTo !== '/';
  const externalReturn = isExternalReturnUrl(redirectTo);

  useEffect(() => {
    if (loading || !user || !externalReturn) return;
    let cancelled = false;
    void (async () => {
      const token = await ensureAccessToken();
      if (cancelled) return;
      window.location.replace(withAccessTokenHash(redirectTo, token));
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureAccessToken, externalReturn, loading, redirectTo, user]);

  if (!loading && user && !externalReturn) {
    return <Navigate to={redirectTo} replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await login(String(form.get('email')), String(form.get('password')));
      if (externalReturn) {
        const token = await ensureAccessToken();
        window.location.assign(withAccessTokenHash(redirectTo, token));
      } else {
        navigate(redirectTo);
      }
    } catch (e) {
      setError(e instanceof Error && e.message === 'account_disabled' ? 'disabled' : 'credentials');
    } finally {
      setSubmitting(false);
    }
  }

  const registerTo = isContextual
    ? `/register?returnUrl=${encodeURIComponent(redirectTo)}`
    : '/register';

  return (
    <AuthCard
      badge={t('auth.signInBadge')}
      title={t('auth.signInTitle')}
      subtitle={isContextual ? t('auth.loginContextual') : t('auth.signInSubtitle')}
      footer={
        <p className="text-center text-pequena text-cac-muted">
          {t('auth.noAccount')}{' '}
          <Link to={registerTo} className="font-bold text-cac-green hover:underline">
            {t('auth.submitSignUp')}
          </Link>
        </p>
      }
    >
      {isContextual ? (
        <div className="flex items-start gap-3 rounded-[12px] border border-cac-green/30 bg-cac-green3 px-3 py-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-cac-green2 text-pequena font-bold text-white">
            →
          </span>
          <div>
            <p className="text-pequena font-bold text-cac-navy">{t('auth.contextualTitle')}</p>
            <p className="mt-1 text-pequena leading-snug text-cac-muted">{t('auth.loginContextualBody')}</p>
          </div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3.5">
        <Input label={t('auth.email')} name="email" type="email" required autoComplete="email" />
        <div className="relative">
          <Input
            label={t('auth.password')}
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            className="pr-16"
          />
          <button
            type="button"
            className="absolute right-2 bottom-[7px] rounded-md px-2 py-1 text-mini font-bold text-cac-green hover:bg-cac-green3"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
          >
            {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
          </button>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-800" role="alert">
            {error === 'disabled' ? t('auth.errorDisabled') : t('auth.error')}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting || (Boolean(user) && externalReturn)}>
          {submitting || (user && externalReturn) ? t('auth.submitting') : t('auth.submitSignIn')}
        </Button>
      </form>
    </AuthCard>
  );
}
