import { env } from '../../config/env.js';
import { prisma } from '../prisma.js';
import { getCachedTranslation, hashSourceText, setCachedTranslation } from './cache.js';
import { isTranslationConfigured, translateWithLibreTranslate } from './libretranslate.js';

export type TranslateTextResult = {
  value: string;
  cacheHit: boolean;
};

/**
 * Traduz uma string: Redis → reuso no Postgres → LibreTranslate.
 * Nunca chama a API se o mesmo texto-fonte já tiver tradução no cache.
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = env.defaultLang,
): Promise<TranslateTextResult> {
  const trimmed = text.trim();
  if (!trimmed || sourceLang === targetLang) {
    return { value: trimmed, cacheHit: true };
  }

  const sourceHash = hashSourceText(trimmed);

  const cached = await getCachedTranslation(sourceLang, targetLang, sourceHash);
  if (cached) {
    return { value: cached, cacheHit: true };
  }

  const reused = await prisma.contentTranslation.findFirst({
    where: { sourceHash, lang: targetLang },
    select: { value: true },
  });
  if (reused?.value) {
    await setCachedTranslation(sourceLang, targetLang, sourceHash, reused.value);
    return { value: reused.value, cacheHit: true };
  }

  if (!isTranslationConfigured()) {
    throw new Error('translation_unconfigured');
  }

  const translated = await translateWithLibreTranslate(trimmed, sourceLang, targetLang);
  await setCachedTranslation(sourceLang, targetLang, sourceHash, translated);
  return { value: translated, cacheHit: false };
}
