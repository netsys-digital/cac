import type { PropsWithChildren } from 'react';

/** Shell centralizado do protótipo: max 1220px + gutters 22px. */
export const containerClassName = 'mx-auto w-full max-w-[1220px] px-[22px]';

export function Container({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`${containerClassName} ${className}`}>{children}</div>;
}
