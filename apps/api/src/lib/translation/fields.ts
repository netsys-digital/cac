export const TRANSLATION_ENTITY_TYPES = [
  'technology',
  'challenge',
  'project',
  'organization',
  'funding_offer',
  'funder',
  'success_case',
] as const;

export type TranslationEntityType = (typeof TRANSLATION_ENTITY_TYPES)[number];

export const SCALAR_FIELDS: Record<TranslationEntityType, string[]> = {
  technology: ['title', 'summary', 'problemStatement', 'howItWorks'],
  challenge: ['title', 'summary', 'context'],
  project: ['title', 'summary'],
  organization: ['summary'],
  funding_offer: ['title', 'summary', 'whatFunds', 'criteria', 'amountRange'],
  funder: ['summary'],
  success_case: ['title', 'summary', 'context', 'outcomes'],
};

export type SourceField = { field: string; value: string };

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function collectSourceFields(
  entityType: TranslationEntityType,
  entity: Record<string, unknown>,
): SourceField[] {
  const fields: SourceField[] = [];
  for (const field of SCALAR_FIELDS[entityType]) {
    const value = asString(entity[field]);
    if (value) fields.push({ field, value });
  }

  if (entityType === 'success_case') {
    const media = Array.isArray(entity.media) ? entity.media : [];
    for (const item of media) {
      if (!item || typeof item !== 'object') continue;
      const row = item as { id?: unknown; caption?: unknown };
      const id = asString(row.id);
      const caption = asString(row.caption);
      if (id && caption) fields.push({ field: `media.${id}.caption`, value: caption });
    }
    const needs = Array.isArray(entity.needs) ? entity.needs : [];
    for (const item of needs) {
      if (!item || typeof item !== 'object') continue;
      const row = item as { id?: unknown; detail?: unknown };
      const id = asString(row.id);
      const detail = asString(row.detail);
      if (id && detail) fields.push({ field: `need.${id}.detail`, value: detail });
    }
  }

  return fields;
}

export function applyFieldMap<T extends Record<string, unknown>>(item: T, map: Map<string, string>): T {
  if (!map.size) return item;
  const next: Record<string, unknown> = { ...item };

  for (const field of Object.keys(next)) {
    if (map.has(field)) next[field] = map.get(field);
  }

  if (Array.isArray(item.media)) {
    next.media = item.media.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      const row = entry as { id?: unknown; caption?: unknown };
      const key = `media.${asString(row.id)}.caption`;
      if (!map.has(key)) return entry;
      return { ...row, caption: map.get(key) };
    });
  }

  if (Array.isArray(item.needs)) {
    next.needs = item.needs.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      const row = entry as { id?: unknown; detail?: unknown };
      const key = `need.${asString(row.id)}.detail`;
      if (!map.has(key)) return entry;
      return { ...row, detail: map.get(key) };
    });
  }

  return next as T;
}
