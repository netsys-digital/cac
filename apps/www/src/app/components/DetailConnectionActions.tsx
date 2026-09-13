import { useTranslation } from 'react-i18next';
import { urls } from '../../config';
import { useConnectionEngagement } from '../hooks/useConnectionEngagement';
import { DetailPrimaryButton, DetailSecondaryButton } from './CatalogDetail';

export function DetailConnectionActions({
  connectUrl,
  targetType,
  targetId,
}: {
  connectUrl: string;
  targetType: string;
  targetId: string;
}) {
  const { t } = useTranslation();
  const { getKind } = useConnectionEngagement();
  const kind = getKind(targetType, targetId);
  const panelHref = `${urls.web}/my/connections`;

  if (kind === 'connected') {
    return (
      <>
        <DetailPrimaryButton href={panelHref} icon="fa-solid fa-thumbs-up" done>
          {t('detail.interestDone')}
        </DetailPrimaryButton>
        <DetailSecondaryButton href={panelHref} icon="fa-solid fa-handshake" done>
          {t('detail.connectDone')}
        </DetailSecondaryButton>
      </>
    );
  }

  if (kind === 'interest') {
    return (
      <>
        <DetailPrimaryButton href={panelHref} icon="fa-solid fa-thumbs-up" done>
          {t('detail.interestDone')}
        </DetailPrimaryButton>
        <DetailSecondaryButton href={panelHref} icon="fa-solid fa-paper-plane" done>
          {t('detail.connectPending')}
        </DetailSecondaryButton>
      </>
    );
  }

  return (
    <>
      <DetailPrimaryButton href={connectUrl} icon="fa-regular fa-thumbs-up">
        {t('detail.interest')}
      </DetailPrimaryButton>
      <DetailSecondaryButton href={connectUrl} icon="fa-regular fa-handshake">
        {t('detail.connect')}
      </DetailSecondaryButton>
    </>
  );
}
