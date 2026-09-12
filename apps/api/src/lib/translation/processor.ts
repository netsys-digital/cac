import { ContentStatus } from '@cac/shared';
import { env } from '../../config/env.js';
import { prisma } from '../prisma.js';
import type { TranslationJob } from '../queue/translation-queue.js';
import { enqueueTranslation } from '../queue/translation-queue.js';
import { hashSourceText } from './cache.js';
import { collectSourceFields, type TranslationEntityType } from './fields.js';
import { isTranslationConfigured } from './libretranslate.js';
import { targetLangs } from './languages.js';
import { translateText } from './translate-text.js';

type LoadedEntity = Record<string, unknown> & { id: string; status?: string };

async function loadEntity(job: TranslationJob): Promise<LoadedEntity | null> {
  let row: unknown = null;
  if (job.entityType === 'technology') {
    row = await prisma.technology.findUnique({
      where: { id: job.entityId },
      include: { tags: true },
    });
  } else if (job.entityType === 'challenge') {
    row = await prisma.challenge.findUnique({
      where: { id: job.entityId },
      include: { tags: true },
    });
  } else if (job.entityType === 'project') {
    row = await prisma.project.findUnique({ where: { id: job.entityId } });
  } else if (job.entityType === 'organization') {
    row = await prisma.organization.findUnique({ where: { id: job.entityId } });
  } else if (job.entityType === 'funding_offer') {
    row = await prisma.fundingOffer.findUnique({ where: { id: job.entityId } });
  } else if (job.entityType === 'funder') {
    row = await prisma.funderProfile.findUnique({ where: { id: job.entityId } });
  } else {
    row = await prisma.successCase.findUnique({
      where: { id: job.entityId },
      include: { media: true, needs: true },
    });
  }
  if (!row || typeof row !== 'object' || !('id' in row)) return null;
  return row as LoadedEntity;
}

function isPublished(entityType: TranslationEntityType, entity: LoadedEntity): boolean {
  if (entityType === 'organization') return true;
  return entity.status === ContentStatus.PUBLISHED;
}

export async function processTranslationJob(job: TranslationJob): Promise<{ translated: number; skipped: number }> {
  const stats = { translated: 0, skipped: 0 };
  if (!env.translationEnabled) return stats;

  const entity = await loadEntity(job);
  if (!entity || !isPublished(job.entityType, entity)) return stats;

  const fields = collectSourceFields(job.entityType, entity);
  const langs = targetLangs();
  if (!fields.length || !langs.length) return stats;

  for (const lang of langs) {
    for (const { field, value } of fields) {
      const sourceHash = hashSourceText(value);
      const existing = await prisma.contentTranslation.findUnique({
        where: {
          entityType_entityId_field_lang: {
            entityType: job.entityType,
            entityId: entity.id,
            field,
            lang,
          },
        },
      });
      if (existing && existing.sourceHash === sourceHash) {
        stats.skipped += 1;
        continue;
      }

      let result: Awaited<ReturnType<typeof translateText>>;
      try {
        result = await translateText(value, lang);
      } catch (error) {
        if (!isTranslationConfigured()) {
          stats.skipped += 1;
          continue;
        }
        throw error;
      }
      await prisma.contentTranslation.upsert({
        where: {
          entityType_entityId_field_lang: {
            entityType: job.entityType,
            entityId: entity.id,
            field,
            lang,
          },
        },
        create: {
          entityType: job.entityType,
          entityId: entity.id,
          field,
          lang,
          value: result.value,
          sourceHash,
        },
        update: {
          value: result.value,
          sourceHash,
        },
      });
      if (result.cacheHit) stats.skipped += 1;
      else stats.translated += 1;
    }
  }

  return stats;
}

export async function enqueueMissingPublishedTranslations(): Promise<number> {
  if (!env.translationEnabled || !isTranslationConfigured()) return 0;
  const langs = targetLangs();
  if (!langs.length) return 0;

  const [technologies, challenges, projects, organizations, offers, funders, cases] = await Promise.all([
    prisma.technology.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { id: true } }),
    prisma.challenge.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { id: true } }),
    prisma.project.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { id: true } }),
    prisma.organization.findMany({ select: { id: true } }),
    prisma.fundingOffer.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { id: true } }),
    prisma.funderProfile.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { id: true } }),
    prisma.successCase.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { id: true } }),
  ]);

  const jobs: TranslationJob[] = [
    ...technologies.map((row) => ({ entityType: 'technology' as const, entityId: row.id })),
    ...challenges.map((row) => ({ entityType: 'challenge' as const, entityId: row.id })),
    ...projects.map((row) => ({ entityType: 'project' as const, entityId: row.id })),
    ...organizations.map((row) => ({ entityType: 'organization' as const, entityId: row.id })),
    ...offers.map((row) => ({ entityType: 'funding_offer' as const, entityId: row.id })),
    ...funders.map((row) => ({ entityType: 'funder' as const, entityId: row.id })),
    ...cases.map((row) => ({ entityType: 'success_case' as const, entityId: row.id })),
  ];

  const existing = await prisma.contentTranslation.findMany({
    where: {
      lang: { in: langs },
      entityId: { in: jobs.map((job) => job.entityId) },
    },
    select: { entityType: true, entityId: true, lang: true },
  });
  const covered = new Set(existing.map((row) => `${row.entityType}:${row.entityId}:${row.lang}`));
  let queued = 0;
  for (const job of jobs) {
    const missing = langs.some((lang) => !covered.has(`${job.entityType}:${job.entityId}:${lang}`));
    if (!missing) continue;
    await enqueueTranslation(job);
    queued += 1;
  }
  return queued;
}
