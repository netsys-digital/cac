import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { getCachedTranslation, hashSourceText, setCachedTranslation } from '../lib/translation/cache.js';
import { applyFieldMap, collectSourceFields } from '../lib/translation/fields.js';
import { localizeEntities } from '../lib/translation/localize.js';
import { translateText } from '../lib/translation/translate-text.js';

const SOURCE = 'Recuperação de pastagens em regiões secas';
const TARGET = 'Pasture recovery in dry regions';

describe('content translation cache', () => {
  const originalUrl = env.libreTranslateUrl;
  const originalEnabled = env.translationEnabled;

  beforeAll(async () => {
    env.translationEnabled = true;
    env.libreTranslateUrl = 'http://libretranslate.test';
    try {
      await redis.connect();
    } catch {
      // ignore
    }
  });

  afterAll(async () => {
    env.libreTranslateUrl = originalUrl;
    env.translationEnabled = originalEnabled;
    vi.unstubAllGlobals();
    redis.disconnect();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    vi.unstubAllGlobals();
    const hash = hashSourceText(SOURCE);
    try {
      await redis.del(`lt:v1:pt:en:${hash}`);
    } catch {
      // ignore
    }
  });

  it('does not call LibreTranslate when Redis already has the string', async () => {
    const hash = hashSourceText(SOURCE);
    await setCachedTranslation('pt', 'en', hash, TARGET);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const first = await translateText(SOURCE, 'en', 'pt');
    const second = await translateText(SOURCE, 'en', 'pt');

    expect(first.value).toBe(TARGET);
    expect(first.cacheHit).toBe(true);
    expect(second.cacheHit).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await getCachedTranslation('pt', 'en', hash)).toBe(TARGET);
  });

  it('calls the API once and reuses Redis on the second identical string', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translatedText: TARGET }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await translateText(SOURCE, 'en', 'pt');
    const second = await translateText(SOURCE, 'en', 'pt');

    expect(first.value).toBe(TARGET);
    expect(first.cacheHit).toBe(false);
    expect(second.value).toBe(TARGET);
    expect(second.cacheHit).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('overlays saved translations on catalog fields and keeps original when lang is default', async () => {
    const item = {
      id: '11111111-1111-1111-1111-111111111111',
      title: SOURCE,
      summary: 'Resumo original em português com tamanho suficiente.',
      problemStatement: 'Problema original',
      howItWorks: 'Funcionamento original',
    };
    await prisma.contentTranslation.deleteMany({
      where: { entityId: item.id },
    });
    await prisma.contentTranslation.create({
      data: {
        entityType: 'technology',
        entityId: item.id,
        field: 'title',
        lang: 'en',
        value: TARGET,
        sourceHash: hashSourceText(SOURCE),
      },
    });

    const localized = await localizeEntities('technology', [item], 'en');
    expect(localized[0].title).toBe(TARGET);
    expect(localized[0].summary).toBe(item.summary);

    const original = await localizeEntities('technology', [item], 'pt');
    expect(original[0].title).toBe(SOURCE);

    await prisma.contentTranslation.deleteMany({ where: { entityId: item.id } });
  });

  it('collects nested success-case captions and applies field map', () => {
    const entity = {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Caso',
      summary: 'Resumo',
      media: [{ id: '33333333-3333-3333-3333-333333333333', caption: 'Foto da lavoura' }],
      needs: [{ id: '44444444-4444-4444-4444-444444444444', detail: 'Precisa de irrigação' }],
    };
    const fields = collectSourceFields('success_case', entity);
    expect(fields.map((f) => f.field)).toEqual(
      expect.arrayContaining(['title', 'summary', 'media.33333333-3333-3333-3333-333333333333.caption']),
    );
    const mapped = applyFieldMap(entity, new Map([['title', 'Case'], ['media.33333333-3333-3333-3333-333333333333.caption', 'Crop photo']]));
    expect(mapped.title).toBe('Case');
    expect((mapped.media as Array<{ caption: string }>)[0].caption).toBe('Crop photo');
  });
});
