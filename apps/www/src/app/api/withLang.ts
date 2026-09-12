import i18n, { normalizeLanguage } from '../../i18n';

export function withLang(path: string): string {
  const lang = normalizeLanguage(i18n.language);
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}lang=${encodeURIComponent(lang)}`;
}
