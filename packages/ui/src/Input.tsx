import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

const labelClass = 'block text-[10px] font-extrabold uppercase tracking-[0.4px] text-cac-muted';
const controlClass =
  'w-full rounded-lg border border-cac-line bg-white px-2.5 py-2 text-[11px] text-cac-navy outline-none ring-cac-green2/40 placeholder:text-cac-muted/70 focus:ring-2';

type FieldMeta = {
  label: string;
  hint?: string;
};

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldMeta;

export function Input({ label, hint, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-1 text-cac-ink">
      <span className={labelClass}>{label}</span>
      {hint ? <span className="text-[10px] leading-snug text-cac-muted normal-case font-normal tracking-normal">{hint}</span> : null}
      <input id={inputId} className={`${controlClass} ${className}`} {...props} />
    </label>
  );
}

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldMeta;

export function TextArea({ label, hint, id, className = '', rows = 4, ...props }: TextAreaProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-1 text-cac-ink">
      <span className={labelClass}>{label}</span>
      {hint ? <span className="text-[10px] leading-snug text-cac-muted normal-case font-normal tracking-normal">{hint}</span> : null}
      <textarea
        id={inputId}
        rows={rows}
        className={`${controlClass} min-h-[88px] resize-y ${className}`}
        {...props}
      />
    </label>
  );
}
