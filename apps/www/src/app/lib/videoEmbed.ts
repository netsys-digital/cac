/** Converte URL pública (YouTube/Vimeo/arquivo) em URL de embed, quando possível. */
export function toVideoEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname.startsWith('/embed/')) return `https://www.youtube.com${url.pathname}`;
    const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
    if (id && id !== 'watch' && id !== 'shorts') {
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.pathname.startsWith('/shorts/')) {
      const shortId = url.pathname.split('/')[2];
      return shortId ? `https://www.youtube.com/embed/${shortId}` : null;
    }
  }

  if (host === 'vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  if (host === 'player.vimeo.com') {
    return url.toString();
  }

  // MP4 / WebM direto ou outro host com iframe próprio
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url.pathname)) {
    return url.toString();
  }

  return url.toString();
}

export function isDirectVideoFile(url: string): boolean {
  try {
    return /\.(mp4|webm|ogg)(\?|$)/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}
