import { type KeyboardEvent, type ReactNode, type TextareaHTMLAttributes, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

type Tool = 'bold' | 'italic' | 'heading' | 'bullet' | 'numbered' | 'quote' | 'link';

const ALL_TOOLS: Tool[] = ['bold', 'italic', 'heading', 'bullet', 'numbered', 'quote', 'link'];
/** Para textos curtos exibidos também em cards (ex.: resumo). */
export const INLINE_TOOLS: Tool[] = ['bold', 'italic', 'link'];

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> & {
  label: string;
  hint?: string;
  name: string;
  tools?: Tool[];
};

/** Substitui a seleção mantendo o histórico de desfazer (Ctrl+Z) do navegador. */
function replaceSelection(el: HTMLTextAreaElement, text: string, selectFrom: number, selectTo: number) {
  el.focus();
  const ok = typeof document.execCommand === 'function' && document.execCommand('insertText', false, text);
  if (!ok) {
    el.setRangeText(text, el.selectionStart, el.selectionEnd, 'end');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  el.setSelectionRange(selectFrom, selectTo);
}

function wrapInline(el: HTMLTextAreaElement, marker: string, placeholder: string) {
  const { selectionStart: start, selectionEnd: end, value } = el;
  const selected = value.slice(start, end);
  const before = value.slice(Math.max(0, start - marker.length), start);
  const after = value.slice(end, end + marker.length);

  if (selected && before === marker && after === marker) {
    el.setSelectionRange(start - marker.length, end + marker.length);
    replaceSelection(el, selected, start - marker.length, end - marker.length);
    return;
  }
  const body = selected || placeholder;
  replaceSelection(el, `${marker}${body}${marker}`, start + marker.length, start + marker.length + body.length);
}

function prefixLines(el: HTMLTextAreaElement, prefix: (index: number) => string, pattern: RegExp) {
  const { value } = el;
  const lineStart = value.lastIndexOf('\n', el.selectionStart - 1) + 1;
  const nextBreak = value.indexOf('\n', el.selectionEnd);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const lines = value.slice(lineStart, lineEnd).split('\n');
  const allPrefixed = lines.every((line) => pattern.test(line));
  const next = lines
    .map((line, index) => (allPrefixed ? line.replace(pattern, '') : `${prefix(index)}${line.replace(pattern, '')}`))
    .join('\n');
  el.setSelectionRange(lineStart, lineEnd);
  replaceSelection(el, next, lineStart, lineStart + next.length);
}

function insertLink(el: HTMLTextAreaElement, urlPlaceholder: string, textPlaceholder: string) {
  const { selectionStart: start, selectionEnd: end, value } = el;
  const selected = value.slice(start, end);
  const isUrl = /^https?:\/\/\S+$/i.test(selected);
  if (isUrl) {
    const text = `[${textPlaceholder}](${selected})`;
    replaceSelection(el, text, start + 1, start + 1 + textPlaceholder.length);
    return;
  }
  const label = selected || textPlaceholder;
  const text = `[${label}](${urlPlaceholder})`;
  const urlStart = start + label.length + 3;
  replaceSelection(el, text, urlStart, urlStart + urlPlaceholder.length);
}

function ToolIcon({ tool }: { tool: Tool }) {
  const common = { viewBox: '0 0 16 16', className: 'size-4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 };
  switch (tool) {
    case 'bold':
      return <span className="text-[0.95rem] leading-none font-black">B</span>;
    case 'italic':
      return <span className="font-serif text-[1rem] leading-none italic">I</span>;
    case 'heading':
      return <span className="text-[0.8rem] leading-none font-extrabold">H</span>;
    case 'bullet':
      return (
        <svg {...common} aria-hidden>
          <path d="M6 4h8M6 8h8M6 12h8" strokeLinecap="round" />
          <circle cx="2.5" cy="4" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="2.5" cy="8" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="2.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'numbered':
      return (
        <svg {...common} aria-hidden>
          <path d="M6.5 4h7.5M6.5 8h7.5M6.5 12h7.5" strokeLinecap="round" />
          <text x="0.6" y="5.6" fontSize="4.6" fill="currentColor" stroke="none" fontWeight="700">1</text>
          <text x="0.6" y="9.6" fontSize="4.6" fill="currentColor" stroke="none" fontWeight="700">2</text>
          <text x="0.6" y="13.6" fontSize="4.6" fill="currentColor" stroke="none" fontWeight="700">3</text>
        </svg>
      );
    case 'quote':
      return (
        <svg {...common} aria-hidden>
          <path d="M3 3v10" strokeLinecap="round" strokeWidth="2.2" />
          <path d="M7 5h7M7 8h7M7 11h4.5" strokeLinecap="round" />
        </svg>
      );
    case 'link':
      return (
        <svg {...common} aria-hidden>
          <path d="M6.6 9.4a2.8 2.8 0 0 0 4 0l2-2a2.8 2.8 0 0 0-4-4l-.7.7" strokeLinecap="round" />
          <path d="M9.4 6.6a2.8 2.8 0 0 0-4 0l-2 2a2.8 2.8 0 0 0 4 4l.7-.7" strokeLinecap="round" />
        </svg>
      );
  }
}

/** Textarea com barra de formatação básica; o valor é salvo em Markdown leve. */
export function RichTextArea({
  label,
  hint,
  name,
  id,
  rows = 4,
  className = '',
  tools = ALL_TOOLS,
  onKeyDown,
  ...props
}: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLTextAreaElement>(null);
  const autoId = useId();
  const inputId = id ?? `${name}-${autoId}`;

  function apply(tool: Tool) {
    const el = ref.current;
    if (!el || el.disabled || el.readOnly) return;
    switch (tool) {
      case 'bold':
        return wrapInline(el, '**', t('richText.boldPlaceholder'));
      case 'italic':
        return wrapInline(el, '_', t('richText.italicPlaceholder'));
      case 'heading':
        return prefixLines(el, () => '### ', /^#{1,6}\s+/);
      case 'bullet':
        return prefixLines(el, () => '- ', /^[-*]\s+/);
      case 'numbered':
        return prefixLines(el, (i) => `${i + 1}. `, /^\d+\.\s+/);
      case 'quote':
        return prefixLines(el, () => '> ', /^>\s?/);
      case 'link':
        return insertLink(el, 'https://', t('richText.linkPlaceholder'));
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    const map: Record<string, Tool> = { b: 'bold', i: 'italic', k: 'link' };
    const tool = map[key];
    if (tool && tools.includes(tool)) {
      event.preventDefault();
      apply(tool);
    }
  }

  const groups: ReactNode[] = [];
  const inline = tools.filter((tool) => tool === 'bold' || tool === 'italic');
  const blocks = tools.filter((tool) => ['heading', 'bullet', 'numbered', 'quote'].includes(tool));
  const extras = tools.filter((tool) => tool === 'link');
  [inline, blocks, extras].forEach((group, index) => {
    if (!group.length) return;
    if (groups.length) {
      groups.push(<span key={`sep-${index}`} className="mx-0.5 h-5 w-px bg-cac-line" aria-hidden />);
    }
    group.forEach((tool) => {
      groups.push(
        <button
          key={tool}
          type="button"
          title={t(`richText.${tool}`)}
          aria-label={t(`richText.${tool}`)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply(tool)}
          className="grid size-7 place-items-center rounded-md text-cac-navy transition hover:bg-cac-green3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cac-green2"
        >
          <ToolIcon tool={tool} />
        </button>,
      );
    });
  });

  return (
    <div className="flex w-full flex-col gap-1 text-cac-ink">
      <label htmlFor={inputId} className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
        {label}
      </label>
      {hint ? <span className="text-mini leading-snug text-cac-muted">{hint}</span> : null}
      <div className="overflow-hidden rounded-lg border border-cac-line bg-white ring-cac-green2/40 focus-within:ring-2">
        <div
          role="toolbar"
          aria-label={t('richText.toolbar')}
          className="flex flex-wrap items-center gap-0.5 border-b border-cac-line bg-[#f7faf8] px-1.5 py-1"
        >
          {groups}
        </div>
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          rows={rows}
          onKeyDown={handleKeyDown}
          className={`block min-h-[88px] w-full resize-y border-0 bg-white px-2.5 py-2 text-pequena text-cac-navy outline-none placeholder:text-cac-muted/70 ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}
