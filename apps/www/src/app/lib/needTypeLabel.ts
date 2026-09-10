/** Labels i18n para NeedType (desafios / casos). */
export function needTypeLabel(value: string | null | undefined, t: (key: string) => string) {
  if (!value) return '';
  const map: Record<string, string> = {
    TECHNOLOGY: t('detail.needs.technology'),
    KNOWLEDGE: t('detail.needs.knowledge'),
    PARTNERSHIP: t('detail.needs.partnership'),
    FUNDING: t('detail.needs.funding'),
    TRAINING: t('detail.needs.training'),
    RESEARCH: t('detail.needs.research'),
    EQUIPMENT: t('detail.needs.equipment'),
  };
  return map[value] ?? value.replace(/_/g, ' ');
}
