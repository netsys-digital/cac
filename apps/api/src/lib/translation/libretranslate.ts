import { env } from '../../config/env.js';

type TranslateResponse = {
  translatedText?: string | string[];
};

/** Boot + 1º load dos modelos Argos pode levar vários minutos. */
const TRANSLATE_TIMEOUT_MS = 180_000;
const READY_TIMEOUT_MS = 8_000;

export function isTranslationConfigured(): boolean {
  return env.translationEnabled && env.translationProvider === 'libretranslate' && Boolean(env.libreTranslateUrl);
}

export function isLibreTranslateUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; code?: string; cause?: { code?: string }; message?: string };
  const code = err.code ?? err.cause?.code ?? '';
  const message = `${err.name ?? ''} ${err.message ?? ''} ${code}`;
  return (
    err.name === 'AbortError' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    /abort|econnrefused|enotfound|econnreset/i.test(message)
  );
}

async function fetchJson(path: string, init: RequestInit, timeoutMs: number): Promise<unknown> {
  if (!env.libreTranslateUrl) {
    throw new Error('libretranslate_unconfigured');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${env.libreTranslateUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`libretranslate_${res.status}${detail ? `:${detail.slice(0, 180)}` : ''}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function isLibreTranslateReady(): Promise<boolean> {
  if (!isTranslationConfigured()) return false;
  try {
    const data = await fetchJson('/languages', { method: 'GET', headers: { Accept: 'application/json' } }, READY_TIMEOUT_MS);
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export async function waitForLibreTranslate(pollMs = 10_000): Promise<void> {
  if (!isTranslationConfigured()) return;
  let announced = false;
  for (;;) {
    if (await isLibreTranslateReady()) {
      if (announced) console.log('[worker] LibreTranslate ready at', env.libreTranslateUrl);
      return;
    }
    if (!announced) {
      console.warn(
        '[worker] LibreTranslate ainda não aceita /languages em',
        env.libreTranslateUrl,
        '— aguardando boot/modelos (pode levar vários minutos)',
      );
      announced = true;
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  return fetchJson(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    },
    TRANSLATE_TIMEOUT_MS,
  );
}

export async function translateWithLibreTranslate(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  if (!text.trim()) return text;
  if (source === target) return text;

  const data = (await postJson('/translate', {
    q: text,
    source,
    target,
    format: 'text',
  })) as TranslateResponse;

  const translated = Array.isArray(data.translatedText) ? data.translatedText[0] : data.translatedText;
  if (typeof translated !== 'string' || !translated.trim()) {
    throw new Error('libretranslate_empty');
  }
  return translated;
}
