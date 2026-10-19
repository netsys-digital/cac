const MARKDOWN_LINK = /\[([^\]]*)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g;
const BARE_URL = /https?:\/\/[^\s<>)\]]+|mailto:[^\s<>)\]]+/g;
const BROKEN_URL = /\[[\s\S]*?\]\(\s*https?:\/\/[\s\S]*?\)|https?:\/\/(?:[^\s<>)\]]|[ \t]*\n[ \t]*[A-Za-z0-9][^\s<>)\]]*)+/g;

type SourceLink = { raw: string; url: string };

function collectLinks(text: string): SourceLink[] {
  const links: SourceLink[] = [];
  for (const match of text.matchAll(MARKDOWN_LINK)) {
    links.push({ raw: match[0], url: match[2] });
  }
  const withoutMarkdown = text.replace(MARKDOWN_LINK, ' ');
  for (const match of withoutMarkdown.matchAll(BARE_URL)) {
    links.push({ raw: match[0], url: match[0] });
  }
  return links;
}

/**
 * Troca URLs por marcas que o tradutor não deve alterar.
 * O rótulo do markdown continua traduzível.
 */
export function shieldUrls(text: string): { text: string; slots: string[] } {
  const slots: string[] = [];
  const token = (value: string) => {
    const mark = `{{ph${slots.length}}}`;
    slots.push(value);
    return mark;
  };
  let out = text.replace(MARKDOWN_LINK, (_match, label: string, url: string) => `[${label}](${token(url)})`);
  out = out.replace(BARE_URL, (url) => token(url));
  return { text: out, slots };
}

export function unshieldUrls(text: string, slots: string[]): string {
  if (!slots.length) return text;
  return text.replace(/\{\{\s*ph\s*(\d+)\s*\}\}/gi, (mark, index: string) => slots[Number(index)] ?? mark);
}

/**
 * Devolve os endereços do texto original quando a tradução os alterou
 * (caminho, idioma da URL ou quebra de linha no meio do link).
 */
export function preserveSourceUrls(source: string, translated: string): string {
  const links = collectLinks(source);
  if (!links.length || links.every((link) => translated.includes(link.url))) return translated;

  let index = 0;
  return translated.replace(BROKEN_URL, (match) => {
    if (links.some((link) => match.includes(link.url))) return match;
    const next = links[index];
    if (!next) return match;
    index += 1;
    if (!match.startsWith('[')) return next.raw;
    const label = /^\s*\[([\s\S]*?)\]/.exec(match)?.[1] ?? '';
    if (/https?:\/\//.test(label)) return next.raw;
    const cleanLabel = label.replace(/\s+/g, ' ').trim();
    return cleanLabel ? `[${cleanLabel}](${next.url})` : next.raw;
  });
}
