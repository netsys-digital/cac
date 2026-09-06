import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';

export function RegisterPage() {
  const { t } = useTranslation();
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
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
      navigate('/');
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
      <h1 className="text-[20px] leading-tight font-black text-cac-navy">{t('auth.signUpTitle')}</h1>
      <Input label={t('auth.name')} name="name" required autoComplete="name" />
      <Input label={t('auth.email')} name="email" type="email" required autoComplete="email" />
      <Input
        label={t('auth.password')}
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
      />
      {error ? <p className="text-[11px] text-red-700">{t('auth.error')}</p> : null}
      <Button type="submit" className="w-full" disabled={submitting}>
        {t('auth.submitSignUp')}
      </Button>
      <Link to="/login" className="block text-[11px] font-black text-cac-green">
        {t('auth.goSignIn')}
      </Link>
    </form>
  );
}
