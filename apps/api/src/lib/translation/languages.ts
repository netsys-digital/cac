import { env } from '../../config/env.js';

export const APP_LANGS = ['pt', 'en', 'es'] as const;
export type AppLang = (typeof APP_LANGS)[number];

export function normalizeLang(value: unknown, fallback = env.defaultLang): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  const base = raw.split(/[-_]/)[0] || fallback;
  const allowed = env.supportedLangs.length ? env.supportedLangs : [...APP_LANGS];
  if (allowed.includes(base)) return base;
  if (APP_LANGS.includes(base as AppLang)) return base;
  return fallback;
}

export function requestLang(query: { lang?: unknown }): string {
  return normalizeLang(query.lang);
}

export function targetLangs(source = env.defaultLang): string[] {
  const allowed = env.supportedLangs.length ? env.supportedLangs : [...APP_LANGS];
  return allowed.filter((lang) => lang && lang !== source);
}

export function isDefaultLang(lang: string): boolean {
  return normalizeLang(lang) === env.defaultLang;
}
