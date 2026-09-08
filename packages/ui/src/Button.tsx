import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'ghostDark' | 'outline';
  }
>;

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'rounded-[10px] bg-cac-green2 px-4 py-2.5 text-[13px] font-black text-white hover:brightness-105 focus-visible:outline-cac-green',
  secondary:
    'rounded-[10px] border border-cac-line bg-white px-4 py-2.5 text-[13px] font-black text-cac-navy hover:bg-cac-bg focus-visible:outline-cac-navy',
  outline:
    'rounded-[10px] border border-cac-green bg-white px-4 py-2.5 text-[13px] font-black text-cac-green hover:bg-cac-green3 focus-visible:outline-cac-green',
  ghost:
    'rounded-[10px] bg-transparent px-4 py-2.5 text-[13px] font-black text-cac-navy hover:bg-cac-bg focus-visible:outline-cac-navy',
  ghostDark:
    'rounded-[10px] border border-[rgba(255,255,255,.22)] bg-transparent px-4 py-2.5 text-[13px] font-black text-white hover:bg-white/10 focus-visible:outline-white',
};

export function Button({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
