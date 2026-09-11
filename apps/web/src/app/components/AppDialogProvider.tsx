import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { DialogProvider } from '@cac/ui';

export function AppDialogProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  return (
    <DialogProvider
      labels={{
        ok: t('dialog.ok'),
        cancel: t('dialog.cancel'),
        confirm: t('dialog.confirm'),
        alertBadge: t('dialog.alertBadge'),
        confirmBadge: t('dialog.confirmBadge'),
        dangerBadge: t('dialog.dangerBadge'),
        promptBadge: t('dialog.promptBadge'),
        promptLabel: t('dialog.promptLabel'),
      }}
    >
      {children}
    </DialogProvider>
  );
}
