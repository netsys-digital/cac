import { urls } from '../../config';

/** Rotas relativas do painel ou URL absoluta do portal (www). */
export function safeReturnUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const target = new URL(value);
    const www = new URL(urls.www);
    if (target.origin === www.origin) return target.toString();
  } catch {
    /* ignore */
  }
  return null;
}

export function isExternalReturnUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}
