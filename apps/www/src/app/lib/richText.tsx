import type { ReactNode } from 'react';

/**
 * Markdown leve produzido pela barra de formatação do painel:
 * **negrito**, _itálico_ / *itálico*, [texto](https://…), ### subtítulo, - lista, 1. lista, > citação.
 * Renderiza só elementos React (sem HTML cru), então é seguro para conteúdo de usuários.
 */

const INLINE_RE = /\*\*(.+?)\*\*|(?<![\w*])_(?!\s)(.+?)(?<!\s)_(?!\w)|(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?!\w)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(INLINE_RE)) {
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyPrefix}-${index++}`;
    const [, bold, italicU, italicS, linkText, linkUrl] = match;
    if (bold !== undefined) {
      out.push(
        <strong key={key} className="font-bold">
          {renderInline(bold, key)}
        </strong>,
      );
    } else if (italicU !== undefined || italicS !== undefined) {
      out.push(<em key={key}>{renderInline(italicU ?? italicS ?? '', key)}</em>);
    } else if (linkText !== undefined && linkUrl) {
      out.push(
        <a
          key={key}
          href={linkUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="font-semibold text-cac-green underline decoration-cac-green/40 underline-offset-2 hover:decoration-cac-green"
        >
          {linkText}
        </a>,
      );
    }
    last = start + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function withBreaks(lines: string[], keyPrefix: string): ReactNode[] {
  return lines.flatMap((line, i) => {
    const parts = renderInline(line, `${keyPrefix}-${i}`);
    return i < lines.length - 1 ? [...parts, <br key={`${keyPrefix}-br-${i}`} />] : parts;
  });
}

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'h'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'quote'; lines: string[] };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let current = null as Block | null;
  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);

    if (heading) {
      flush();
      blocks.push({ kind: 'h', text: heading[1] });
    } else if (bullet) {
      if (current?.kind !== 'ul') flush();
      current ??= { kind: 'ul', items: [] };
      (current as Extract<Block, { kind: 'ul' }>).items.push(bullet[1]);
    } else if (numbered) {
      if (current?.kind !== 'ol') flush();
      current ??= { kind: 'ol', items: [] };
      (current as Extract<Block, { kind: 'ol' }>).items.push(numbered[1]);
    } else if (quote) {
      if (current?.kind !== 'quote') flush();
      current ??= { kind: 'quote', lines: [] };
      (current as Extract<Block, { kind: 'quote' }>).lines.push(quote[1]);
    } else {
      if (current?.kind !== 'p') flush();
      current ??= { kind: 'p', lines: [] };
      (current as Extract<Block, { kind: 'p' }>).lines.push(line);
    }
  }
  flush();
  return blocks;
}

type RichTextProps = {
  text?: string | null;
  className?: string;
};

/** Texto longo formatado (parágrafos, subtítulos, listas, citações, negrito, itálico e links). */
export function RichText({ text, className = '' }: RichTextProps) {
  if (!text?.trim()) return null;
  const blocks = parseBlocks(text);
  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, i) => {
        const key = `b${i}`;
        switch (block.kind) {
          case 'h':
            return (
              <h4 key={key} className="pt-1 text-media font-bold text-cac-navy">
                {renderInline(block.text, key)}
              </h4>
            );
          case 'ul':
            return (
              <ul key={key} className="list-disc space-y-1 pl-5 marker:text-cac-green">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={key} className="list-decimal space-y-1 pl-5 marker:font-bold marker:text-cac-green">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          case 'quote':
            return (
              <blockquote
                key={key}
                className="rounded-r-lg border-l-4 border-cac-green/60 bg-cac-green3/40 px-4 py-2 text-cac-ink/85 italic"
              >
                {withBreaks(block.lines, key)}
              </blockquote>
            );
          default:
            return <p key={key}>{withBreaks(block.lines, key)}</p>;
        }
      })}
    </div>
  );
}

/** Formatação só de linha (negrito, itálico, link) — para resumos em destaque. */
export function RichInline({ text }: { text?: string | null }) {
  if (!text) return null;
  return <>{withBreaks(text.replace(/\r\n?/g, '\n').split('\n'), 'i')}</>;
}

/** Remove a marcação para exibir texto limpo em cards e listagens. */
export function plainText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<![\w*])_(?!\s)(.+?)(?<!\s)_(?!\w)/g, '$1')
    .replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\s*\n+\s*/g, ' ')
    .trim();
}
