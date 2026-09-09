import { useTranslation } from 'react-i18next';
import { UserRole } from '@cac/shared';
import { useAuth } from '../auth/AuthContext';
import { useRepresentation } from '../auth/RepresentationContext';
import { CuratorDashboardPage } from './admin/CuratorDashboardPage';
import { DashboardPage } from './DashboardPage';
import { OnboardingIntentPage } from './auth/OnboardingIntentPage';

/**
 * Painel inicial:
 * - ADMIN/CURADOR → dashboard de governança (filas + KPIs)
 * - sem representação aprovada → primeiros passos
 * - com vínculo aprovado → dashboard de publicações da org
 */
export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { loading, canPublish, isStaff } = useRepresentation();
  const staffRole = user?.role === UserRole.ADMIN || user?.role === UserRole.CURADOR;

  if (loading) {
    return (
      <div className="rounded-2xl border border-cac-line bg-white p-5 text-media text-cac-muted shadow-cac">
        {t('dash.loading')}
      </div>
    );
  }

  if (staffRole || isStaff) {
    return <CuratorDashboardPage />;
  }

  return canPublish ? <DashboardPage /> : <OnboardingIntentPage />;
}
