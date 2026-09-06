import { redis } from '../redis.js';

export const EMBEDDING_QUEUE = 'embedding:index';

export type EmbeddingJob = {
  entityType: 'technology' | 'challenge' | 'project';
  entityId: string;
};

export async function enqueueEmbedding(job: EmbeddingJob): Promise<void> {
  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }
    await redis.rpush(EMBEDDING_QUEUE, JSON.stringify(job));
  } catch (error) {
    console.warn('[queue] enqueueEmbedding failed', error);
  }
}

export async function dequeueEmbedding(timeoutSec = 5): Promise<EmbeddingJob | null> {
  if (redis.status !== 'ready') {
    await redis.connect();
  }
  const result = await redis.blpop(EMBEDDING_QUEUE, timeoutSec);
  if (!result) return null;
  const raw = result[1];
  try {
    return JSON.parse(raw) as EmbeddingJob;
  } catch {
    return null;
  }
}
