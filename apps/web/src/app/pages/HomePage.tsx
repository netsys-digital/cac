import { useTranslation } from 'react-i18next';
import { UserRole } from '@cac/shared';
import { useAuth } from '../auth/AuthContext';
import { useRepresentation } from '../auth/RepresentationContext';
import { CuratorDashboardPage } from './admin/CuratorDashboardPage';
import { DashboardPage } from './DashboardPage';
import { OnboardingIntentPage } from './auth/OnboardingIntentPage';

/**
 * Painel inicial por perfil:
 * - CURADOR → filas de governança (CuratorDashboard)
 * - ADMIN → dashboard operacional + atalhos de plataforma
 * - ORG com representação aprovada → dashboard de publicações
 * - demais → primeiros passos / onboarding
 */
export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { loading, canPublish, isCurator } = useRepresentation();

  if (loading) {
    return (
      <div className="rounded-2xl border border-cac-line bg-white p-5 text-media text-cac-muted shadow-cac">
        {t('dash.loading')}
      </div>
    );
  }

  if (isCurator || user?.role === UserRole.CURADOR) {
    return <CuratorDashboardPage />;
  }

  return canPublish ? <DashboardPage /> : <OnboardingIntentPage />;
}
