import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';

export type ModalMode = 'create' | 'edit' | 'view';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  mode?: ModalMode;
  title: string;
  badge?: string;
  description?: string;
  size?: 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
};

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export function Modal({
  open,
  onClose,
  mode,
  title,
  badge,
  description,
  size = 'lg',
  children,
  footer,
  dismissible = true,
}: ModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, dismissible]);

  const onBackdrop = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!dismissible) return;
      if (e.target === e.currentTarget) onClose();
    },
    [dismissible, onClose],
  );

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(10,36,64,.45)] p-3 sm:items-center sm:p-6"
      onClick={onBackdrop}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex max-h-[min(92vh,880px)] w-full flex-col overflow-hidden rounded-[19px] border border-cac-line bg-white shadow-cac outline-none ${sizeClass[size]}`}
      >
        <header className="shrink-0 border-b border-cac-line px-5 py-4 md:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {badge ? (
                <p className="text-mini font-extrabold tracking-[1.4px] text-cac-green uppercase">
                  {badge}
                  {mode ? ` · ${t(`common.mode.${mode}`)}` : ''}
                </p>
              ) : null}
              <h2 id={titleId} className="mt-1 text-grande leading-tight font-bold text-cac-navy">
                {title}
              </h2>
              {description ? (
                <p className="mt-1.5 text-pequena leading-relaxed text-cac-muted">{description}</p>
              ) : null}
            </div>
            <Button type="button" variant="ghost" className="!px-2.5 !py-1.5 shrink-0" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfcfb] px-5 py-4 md:px-6">{children}</div>

        {footer ? (
          <footer className="shrink-0 border-t border-cac-line bg-white px-5 py-3 md:px-6">
            <div className="flex flex-wrap items-center justify-end gap-2">{footer}</div>
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
