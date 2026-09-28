import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import * as authApi from '../../api/authApi';
import { AuthCard } from '../../layout/AuthLayout';

function mailLang(language: string): 'pt' | 'en' | 'es' {
  const base = language.slice(0, 2).toLowerCase();
  return base === 'en' || base === 'es' ? base : 'pt';
}

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<'generic' | 'rate' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email')).trim();
    setSubmitting(true);
    setError(null);
    try {
      await authApi.forgotPassword({ email, lang: mailLang(i18n.language) });
      setSentTo(email);
    } catch (e) {
      setError(e instanceof Error && e.message === 'too_many_requests' ? 'rate' : 'generic');
    } finally {
      setSubmitting(false);
    }
  }

  const footer = (
    <p className="text-center text-pequena text-cac-muted">
      {t('auth.rememberedPassword')}{' '}
      <Link to="/login" className="font-bold text-cac-green hover:underline">
        {t('auth.submitSignIn')}
      </Link>
    </p>
  );

  if (sentTo) {
    return (
      <AuthCard badge={t('auth.forgotBadge')} title={t('auth.forgotSentTitle')} footer={footer}>
        <div className="flex items-start gap-3 rounded-[12px] border border-cac-green/30 bg-cac-green3 px-3 py-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-cac-green2 text-pequena font-bold text-white">
            ✓
          </span>
          <div>
            <p className="text-pequena font-bold text-cac-navy">{t('auth.forgotSentLead', { email: sentTo })}</p>
            <p className="mt-1 text-pequena leading-snug text-cac-muted">{t('auth.forgotSentBody')}</p>
          </div>
        </div>
        <ul className="space-y-1.5 text-pequena leading-snug text-cac-muted">
          <li>• {t('auth.forgotTipSpam')}</li>
          <li>• {t('auth.forgotTipValidity')}</li>
        </ul>
        <Button type="button" variant="secondary" className="w-full" onClick={() => setSentTo(null)}>
          {t('auth.forgotSendAgain')}
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      badge={t('auth.forgotBadge')}
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSubtitle')}
      footer={footer}
    >
      <form onSubmit={onSubmit} className="space-y-3.5">
        <Input
          label={t('auth.email')}
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          hint={t('auth.forgotEmailHint')}
        />

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-800" role="alert">
            {error === 'rate' ? t('auth.forgotRateLimited') : t('auth.forgotError')}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t('auth.submitting') : t('auth.forgotSubmit')}
        </Button>
      </form>
    </AuthCard>
  );
}
