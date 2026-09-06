import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm text-cac-ink">
      <span className="font-medium">{label}</span>
      <input
        id={inputId}
        className={`rounded-md border border-cac-line bg-white px-3 py-2 outline-none ring-cac-leaf focus:ring-2 ${className}`}
        {...props}
      />
    </label>
  );
}
