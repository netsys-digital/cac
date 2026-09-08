import { useTranslation } from 'react-i18next';
import { useRepresentation } from '../auth/RepresentationContext';
import { DashboardPage } from './DashboardPage';
import { OnboardingIntentPage } from './auth/OnboardingIntentPage';

/**
 * Painel inicial:
 * - sem representação aprovada → welcome permanece como home (perfil incompleto)
 * - com vínculo aprovado (ou staff) → dashboard operacional de publicações
 */
export function HomePage() {
  const { t } = useTranslation();
  const { loading, canPublish } = useRepresentation();

  if (loading) {
    return (
      <div className="rounded-[16px] border border-cac-line bg-white p-6 text-[12px] text-cac-muted shadow-cac">
        {t('dash.loading')}
      </div>
    );
  }

  return canPublish ? <DashboardPage /> : <OnboardingIntentPage />;
}
