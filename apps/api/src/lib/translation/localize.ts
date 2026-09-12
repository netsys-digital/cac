import { env } from '../../config/env.js';
import { prisma } from '../prisma.js';
import { enqueueTranslation } from '../queue/translation-queue.js';
import { getCachedTranslations, hashSourceText, setCachedTranslation } from './cache.js';
import { applyFieldMap, collectSourceFields, type TranslationEntityType } from './fields.js';
import { isDefaultLang, normalizeLang } from './languages.js';

type Identified = { id: string };

function asRecord(item: Identified): Record<string, unknown> & Identified {
  return item as Record<string, unknown> & Identified;
}

async function persistFromCache(
  entityType: TranslationEntityType,
  entityId: string,
  field: string,
  lang: string,
  sourceHash: string,
  value: string,
): Promise<void> {
  await prisma.contentTranslation.upsert({
    where: {
      entityType_entityId_field_lang: { entityType, entityId, field, lang },
    },
    create: { entityType, entityId, field, lang, value, sourceHash },
    update: { value, sourceHash },
  });
}

/**
 * Aplica traduções já salvas (Postgres) e, se faltar, o cache Redis do mesmo texto.
 * Não chama LibreTranslate no request — o worker faz isso de forma assíncrona.
 */
export async function localizeEntities<T extends Identified>(
  entityType: TranslationEntityType,
  items: T[],
  lang: string,
  options?: { nestedOrganization?: boolean },
): Promise<T[]> {
  if (!items.length) return items;
  const target = normalizeLang(lang);
  if (isDefaultLang(target)) return items;

  const ids = items.map((item) => item.id);
  const rows = await prisma.contentTranslation.findMany({
    where: { entityType, entityId: { in: ids }, lang: target },
  });
  const byEntity = new Map<string, Map<string, { value: string; sourceHash: string }>>();
  for (const row of rows) {
    const map = byEntity.get(row.entityId) ?? new Map();
    map.set(row.field, { value: row.value, sourceHash: row.sourceHash });
    byEntity.set(row.entityId, map);
  }

  const missingHashes: string[] = [];
  const pending: Array<{
    item: T;
    field: string;
    value: string;
    sourceHash: string;
  }> = [];

  for (const item of items) {
    const fields = collectSourceFields(entityType, asRecord(item));
    const stored = byEntity.get(item.id) ?? new Map();
    for (const { field, value } of fields) {
      const sourceHash = hashSourceText(value);
      const hit = stored.get(field);
      if (hit && hit.sourceHash === sourceHash) continue;
      pending.push({ item, field, value, sourceHash });
      missingHashes.push(sourceHash);
    }
  }

  const cached = await getCachedTranslations(env.defaultLang, target, missingHashes);
  const missingFromCache = [...new Set(missingHashes)].filter((hash) => !cached.has(hash));
  if (missingFromCache.length) {
    const reused = await prisma.contentTranslation.findMany({
      where: {
        sourceHash: { in: missingFromCache },
        lang: target,
      },
      select: { sourceHash: true, value: true },
    });
    for (const row of reused) cached.set(row.sourceHash, row.value);
  }

  const overlays = new Map<string, Map<string, string>>();
  for (const item of items) {
    const stored = byEntity.get(item.id);
    if (!stored) continue;
    const map = new Map<string, string>();
    for (const { field, value } of collectSourceFields(entityType, asRecord(item))) {
      const hit = stored.get(field);
      if (hit && hit.sourceHash === hashSourceText(value)) {
        map.set(field, hit.value);
      }
    }
    if (map.size) overlays.set(item.id, map);
  }

  const unresolved = new Set<string>();
  for (const entry of pending) {
    const cachedValue = cached.get(entry.sourceHash);
    if (!cachedValue) {
      unresolved.add(entry.item.id);
      continue;
    }
    const map = overlays.get(entry.item.id) ?? new Map();
    map.set(entry.field, cachedValue);
    overlays.set(entry.item.id, map);
    void persistFromCache(entityType, entry.item.id, entry.field, target, entry.sourceHash, cachedValue);
    void setCachedTranslation(env.defaultLang, target, entry.sourceHash, cachedValue);
  }

  for (const id of unresolved) {
    void enqueueTranslation({ entityType, entityId: id });
  }

  let localized = items.map((item) => {
    const map = overlays.get(item.id);
    if (!map?.size) return item;
    return applyFieldMap(asRecord(item), map) as T;
  });

  if (options?.nestedOrganization) {
    const orgs = localized
      .map((item) => {
        const org = (item as { organization?: Identified | null }).organization;
        return org ?? null;
      })
      .filter((org): org is Identified => Boolean(org?.id));
    if (orgs.length) {
      const unique = [...new Map(orgs.map((org) => [org.id, org])).values()];
      const translatedOrgs = await localizeEntities('organization', unique, target);
      const byId = new Map(translatedOrgs.map((org) => [org.id, org]));
      localized = localized.map((item) => {
        const current = (item as { organization?: Identified | null }).organization;
        if (!current?.id) return item;
        const nextOrg = byId.get(current.id);
        if (!nextOrg) return item;
        return { ...item, organization: { ...current, ...nextOrg } };
      });
    }
  }

  return localized;
}

export async function localizeOne<T extends Identified>(
  entityType: TranslationEntityType,
  item: T,
  lang: string,
  options?: { nestedOrganization?: boolean },
): Promise<T> {
  const [localized] = await localizeEntities(entityType, [item], lang, options);
  return localized;
}
