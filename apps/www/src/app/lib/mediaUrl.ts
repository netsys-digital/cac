import { urls } from '../../config';

/** Resolve `/uploads/...` against the API origin for public media. */
export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path;
  return `${urls.api}${path.startsWith('/') ? path : `/${path}`}`;
}
