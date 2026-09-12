import { createHash } from 'node:crypto';
import { redis } from '../redis.js';

const CACHE_PREFIX = 'lt:v1';

export function hashSourceText(text: string): string {
  return createHash('sha256').update(text.trim()).digest('hex');
}

export function translationCacheKey(sourceLang: string, targetLang: string, sourceHash: string): string {
  return `${CACHE_PREFIX}:${sourceLang}:${targetLang}:${sourceHash}`;
}

async function ensureRedis(): Promise<boolean> {
  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }
    return redis.status === 'ready';
  } catch (error) {
    console.warn('[translation] redis unavailable', error);
    return false;
  }
}

export async function getCachedTranslation(
  sourceLang: string,
  targetLang: string,
  sourceHash: string,
): Promise<string | null> {
  if (!(await ensureRedis())) return null;
  try {
    return await redis.get(translationCacheKey(sourceLang, targetLang, sourceHash));
  } catch (error) {
    console.warn('[translation] cache get failed', error);
    return null;
  }
}

export async function setCachedTranslation(
  sourceLang: string,
  targetLang: string,
  sourceHash: string,
  value: string,
): Promise<void> {
  if (!(await ensureRedis())) return;
  try {
    await redis.set(translationCacheKey(sourceLang, targetLang, sourceHash), value);
  } catch (error) {
    console.warn('[translation] cache set failed', error);
  }
}

export async function getCachedTranslations(
  sourceLang: string,
  targetLang: string,
  hashes: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(hashes.filter(Boolean))];
  if (!unique.length || !(await ensureRedis())) return out;
  try {
    const keys = unique.map((hash) => translationCacheKey(sourceLang, targetLang, hash));
    const values = await redis.mget(...keys);
    values.forEach((value, idx) => {
      if (value) out.set(unique[idx], value);
    });
  } catch (error) {
    console.warn('[translation] cache mget failed', error);
  }
  return out;
}
