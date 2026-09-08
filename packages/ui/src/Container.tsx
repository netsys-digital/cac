import type { PropsWithChildren } from 'react';

/** Shell do gestor: largura maior para aproveitar o viewport. */
export const containerClassName = 'mx-auto w-full max-w-[1480px] px-5 md:px-7';

export function Container({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`${containerClassName} ${className}`}>{children}</div>;
}
