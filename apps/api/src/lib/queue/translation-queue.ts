import { redis } from '../redis.js';
import { env } from '../../config/env.js';
import type { TranslationEntityType } from '../translation/fields.js';

export const TRANSLATION_QUEUE = 'translation:content';

export type TranslationJob = {
  entityType: TranslationEntityType;
  entityId: string;
};

export function isTranslationQueueEnabled(): boolean {
  return env.translationEnabled;
}

export async function enqueueTranslation(job: TranslationJob): Promise<void> {
  if (!isTranslationQueueEnabled()) return;
  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }
    await redis.rpush(TRANSLATION_QUEUE, JSON.stringify(job));
  } catch (error) {
    console.warn('[queue] enqueueTranslation failed', error);
  }
}

export async function enqueueTranslationIfPublished(
  status: string | null | undefined,
  job: TranslationJob,
): Promise<void> {
  if (status === 'PUBLISHED') {
    await enqueueTranslation(job);
  }
}

export async function dequeueTranslation(timeoutSec = 5): Promise<TranslationJob | null> {
  if (redis.status !== 'ready') {
    await redis.connect();
  }
  const result = await redis.blpop(TRANSLATION_QUEUE, timeoutSec);
  if (!result) return null;
  try {
    const parsed = JSON.parse(result[1]) as TranslationJob;
    if (!parsed?.entityType || !parsed?.entityId) return null;
    return parsed;
  } catch {
    return null;
  }
}
