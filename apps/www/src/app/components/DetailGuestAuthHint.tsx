import { useTranslation } from 'react-i18next';
import { usePortalAuth } from '../auth/PortalAuthContext';

/** Dica de cadastro — só para visitantes sem sessão. */
export function DetailGuestAuthHint() {
  const { t } = useTranslation();
  const { user, loading } = usePortalAuth();

  if (loading || user) return null;

  return (
    <p className="pt-1 text-pequena leading-snug text-cac-muted">{t('detail.actionsHint')}</p>
  );
}
