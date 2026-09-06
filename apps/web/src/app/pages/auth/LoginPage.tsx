import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';

export function LoginPage({ forcedFrom }: { forcedFrom?: string | null }) {
  const { t } = useTranslation();
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo =
    forcedFrom || (location.state as { from?: string } | null)?.from || '/';

  if (!loading && user) {
    return <Navigate to={redirectTo} replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(false);
    try {
      await login(String(form.get('email')), String(form.get('password')));
      navigate(redirectTo);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-cac-line bg-white p-[23px] shadow-cac"
    >
      <h1 className="text-[20px] leading-tight font-black text-cac-navy">{t('auth.signInTitle')}</h1>
      <Input label={t('auth.email')} name="email" type="email" required autoComplete="email" />
      <Input
        label={t('auth.password')}
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />
      {error ? <p className="text-[11px] text-red-700">{t('auth.error')}</p> : null}
      <Button type="submit" className="w-full" disabled={submitting}>
        {t('auth.submitSignIn')}
      </Button>
      <Link to="/register" className="block text-[11px] font-black text-cac-green">
        {t('auth.goSignUp')}
      </Link>
    </form>
  );
}
