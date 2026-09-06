/** Express 5 types params as string | string[]. Normalize to a single string. */
export function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when value is a RFC-style UUID safe for Prisma. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
