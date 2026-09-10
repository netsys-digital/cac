/** Locales BCP 47 alinhados aos idiomas do CAC (pt / en / es). */
export function resolveDateLocale(language: string | null | undefined): string {
  const base = (language ?? 'pt').toLowerCase().split('-')[0];
  if (base === 'en') return 'en-US';
  if (base === 'es') return 'es-ES';
  return 'pt-BR';
}

/**
 * Interpreta ISO completo ou só `YYYY-MM-DD` sem deslocar o dia por fuso.
 */
export function parseDateInput(value: string | Date): Date {
  if (value instanceof Date) return value;
  const trimmed = value.trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})T/.exec(trimmed);
  if (isoDate && /T00:00:00(\.0+)?(Z|[+-]00:00)?$/.test(trimmed)) {
    return new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
  }
  return new Date(trimmed);
}

/** Data curta conforme o idioma (ex.: 10 de mar. de 2027 · Mar 10, 2027 · 10 mar 2027). */
export function formatDate(
  value: string | Date | null | undefined,
  language: string | null | undefined,
): string {
  if (value == null || value === '') return '';
  try {
    return new Intl.DateTimeFormat(resolveDateLocale(language), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parseDateInput(value));
  } catch {
    return String(value);
  }
}

/** Data + hora conforme o idioma. */
export function formatDateTime(
  value: string | Date | null | undefined,
  language: string | null | undefined,
): string {
  if (value == null || value === '') return '';
  try {
    return new Intl.DateTimeFormat(resolveDateLocale(language), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parseDateInput(value));
  } catch {
    return String(value);
  }
}
