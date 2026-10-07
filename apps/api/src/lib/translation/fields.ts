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
  technology: [
    'title',
    'summary',
    'problemStatement',
    'howItWorks',
    'methodology',
    'accessInfo',
    'cardTitle',
    'cardSummary',
  ],
  challenge: ['title', 'summary', 'context', 'cardTitle', 'cardSummary'],
  project: ['title', 'summary'],
  organization: ['summary'],
  funding_offer: ['title', 'summary', 'whatFunds', 'criteria', 'amountRange', 'cardTitle', 'cardSummary'],
  funder: ['summary'],
  success_case: ['title', 'summary', 'context', 'outcomes', 'cardTitle', 'cardSummary'],
};

export type SourceField = { field: string; value: string };

/** Galeria/documentos (`PublicationAttachment`) carregados em `entity.attachments`. */
const ATTACHMENT_TEXT_FIELDS = ['title', 'description'] as const;

/** Tipo de tradução da publicação dona de um anexo (`PublicationAttachment.entityType`). */
export const ATTACHMENT_OWNER_TRANSLATION: Record<string, TranslationEntityType> = {
  TECHNOLOGY: 'technology',
  CHALLENGE: 'challenge',
  FUNDING_OFFER: 'funding_offer',
  SUCCESS_CASE: 'success_case',
};

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

  const attachments = Array.isArray(entity.attachments) ? entity.attachments : [];
  for (const item of attachments) {
    if (!item || typeof item !== 'object') continue;
    const row = item as { id?: unknown; title?: unknown; description?: unknown };
    const id = asString(row.id);
    if (!id) continue;
    for (const key of ATTACHMENT_TEXT_FIELDS) {
      const value = asString(row[key]);
      if (value) fields.push({ field: `attachment.${id}.${key}`, value });
    }
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

  if (Array.isArray(item.attachments)) {
    next.attachments = item.attachments.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      const row = entry as { id?: unknown };
      const id = asString(row.id);
      let changed: Record<string, unknown> | null = null;
      for (const key of ATTACHMENT_TEXT_FIELDS) {
        const mapKey = `attachment.${id}.${key}`;
        if (map.has(mapKey)) {
          changed = changed ?? { ...row };
          changed[key] = map.get(mapKey);
        }
      }
      return changed ?? entry;
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
