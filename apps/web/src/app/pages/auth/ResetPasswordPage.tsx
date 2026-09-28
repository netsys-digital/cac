import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import * as authApi from '../../api/authApi';
import { useAuth } from '../../auth/AuthContext';
import { AuthCard } from '../../layout/AuthLayout';

type TokenState = 'checking' | 'valid' | 'invalid';

export function ResetPasswordPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const langParam = params.get('lang');
  const [tokenState, setTokenState] = useState<TokenState>('checking');
  const [maskedEmail, setMaskedEmail] = useState<string | undefined>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (langParam && ['pt', 'en', 'es'].includes(langParam) && !i18n.language.startsWith(langParam)) {
      void i18n.changeLanguage(langParam);
    }
  }, [i18n, langParam]);

  useEffect(() => {
    if (!token) {
      setTokenState('invalid');
      return;
    }
    let cancelled = false;
    authApi
      .validateResetToken(token)
      .then((res) => {
        if (cancelled) return;
        setTokenState(res.valid ? 'valid' : 'invalid');
        setMaskedEmail(res.email);
      })
      .catch(() => {
        if (!cancelled) setTokenState('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const passwordHint = useMemo(() => {
    if (password.length === 0) return t('auth.passwordHint');
    if (password.length < 8) return t('auth.passwordWeak');
    return t('auth.passwordOk');
  }, [password, t]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError(t('auth.passwordWeak'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.resetMismatch'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authApi.resetPassword({ token, password });
      if (user) await logout();
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (e) {
      if (e instanceof Error && e.message === 'invalid_or_expired_token') {
        setTokenState('invalid');
      } else {
        setError(t('auth.resetError'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const footer = (
    <p className="text-center text-pequena text-cac-muted">
      <Link to="/login" className="font-bold text-cac-green hover:underline">
        {t('auth.backToLogin')}
      </Link>
    </p>
  );

  if (tokenState === 'checking') {
    return (
      <AuthCard badge={t('auth.resetBadge')} title={t('auth.resetTitle')}>
        <p className="text-pequena text-cac-muted">{t('auth.resetChecking')}</p>
      </AuthCard>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <AuthCard badge={t('auth.resetBadge')} title={t('auth.resetInvalidTitle')} footer={footer}>
        <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-3">
          <p className="text-pequena leading-snug text-amber-900">{t('auth.resetInvalidBody')}</p>
        </div>
        <Link to="/forgot-password" className="block">
          <Button type="button" className="w-full">
            {t('auth.resetRequestNew')}
          </Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      badge={t('auth.resetBadge')}
      title={t('auth.resetTitle')}
      subtitle={maskedEmail ? t('auth.resetSubtitleFor', { email: maskedEmail }) : t('auth.resetSubtitle')}
      footer={footer}
    >
      <form onSubmit={onSubmit} className="space-y-3.5">
        <div className="relative">
          <Input
            label={t('auth.resetNewPassword')}
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            autoFocus
            hint={passwordHint}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        <Input
          label={t('auth.resetConfirmPassword')}
          name="confirm"
          type={showPassword ? 'text' : 'password'}
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <p className="rounded-[12px] border border-cac-line bg-[#fbfcfb] px-3 py-2.5 text-pequena leading-snug text-cac-muted">
          {t('auth.resetSessionsNotice')}
        </p>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t('auth.submitting') : t('auth.resetSubmit')}
        </Button>
      </form>
    </AuthCard>
  );
}
