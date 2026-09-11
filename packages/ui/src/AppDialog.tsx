import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Input } from './Input';

export type DialogTone = 'default' | 'danger';

export type DialogLabels = {
  ok: string;
  cancel: string;
  confirm: string;
  alertBadge: string;
  confirmBadge: string;
  dangerBadge: string;
  promptBadge: string;
  promptLabel: string;
};

const DEFAULT_LABELS: DialogLabels = {
  ok: 'OK',
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  alertBadge: 'Aviso',
  confirmBadge: 'Confirmação',
  dangerBadge: 'Atenção',
  promptBadge: 'Informe',
  promptLabel: 'Resposta',
};

export type AlertOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  badge?: string;
};

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  badge?: string;
};

export type PromptOptions = ConfirmOptions & {
  defaultValue?: string;
  placeholder?: string;
  inputLabel?: string;
  required?: boolean;
};

export type DialogApi = {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

type AlertRequest = { kind: 'alert'; options: AlertOptions; resolve: (value: void) => void };
type ConfirmRequest = { kind: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void };
type PromptRequest = { kind: 'prompt'; options: PromptOptions; resolve: (value: string | null) => void };
type DialogRequest = AlertRequest | ConfirmRequest | PromptRequest;

const DialogContext = createContext<DialogApi | null>(null);

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconQuestion() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.2a2.8 2.8 0 1 1 4.4 2.3c-.8.5-1.6 1.1-1.6 2.2V14" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0 0-3L17.5 3.5a2.1 2.1 0 0 0-3 0L4 14v6Z" strokeLinejoin="round" />
      <path d="M13 6.5 16.5 10" strokeLinecap="round" />
    </svg>
  );
}

function toneIcon(kind: DialogRequest['kind'], tone: DialogTone): ReactNode {
  if (kind === 'alert') return <IconInfo />;
  if (kind === 'prompt') return <IconEdit />;
  if (tone === 'danger') return <IconWarning />;
  return <IconQuestion />;
}

function badgeFor(kind: DialogRequest['kind'], tone: DialogTone, labels: DialogLabels, custom?: string) {
  if (custom) return custom;
  if (kind === 'alert') return labels.alertBadge;
  if (kind === 'prompt') return labels.promptBadge;
  if (tone === 'danger') return labels.dangerBadge;
  return labels.confirmBadge;
}

type DialogProviderProps = PropsWithChildren<{
  labels?: Partial<DialogLabels>;
}>;

export function DialogProvider({ children, labels: labelOverrides }: DialogProviderProps) {
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelOverrides }), [labelOverrides]);
  const [current, setCurrent] = useState<DialogRequest | null>(null);
  const queueRef = useRef<DialogRequest[]>([]);
  const [promptValue, setPromptValue] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  const dequeue = useCallback(() => {
    setCurrent(queueRef.current.shift() ?? null);
  }, []);

  const enqueue = useCallback((request: DialogRequest) => {
    setCurrent((prev) => {
      if (prev) {
        queueRef.current.push(request);
        return prev;
      }
      return request;
    });
  }, []);

  const api = useMemo<DialogApi>(
    () => ({
      alert: (options) =>
        new Promise<void>((resolve) => {
          enqueue({ kind: 'alert', options, resolve });
        }),
      confirm: (options) =>
        new Promise<boolean>((resolve) => {
          enqueue({ kind: 'confirm', options, resolve });
        }),
      prompt: (options) =>
        new Promise<string | null>((resolve) => {
          enqueue({ kind: 'prompt', options, resolve });
        }),
    }),
    [enqueue],
  );

  useEffect(() => {
    if (current?.kind === 'prompt') {
      setPromptValue(current.options.defaultValue ?? '');
    } else {
      setPromptValue('');
    }
  }, [current]);

  const closeAlert = useCallback(() => {
    if (!current || current.kind !== 'alert') return;
    current.resolve();
    dequeue();
  }, [current, dequeue]);

  const closeConfirm = useCallback(
    (accepted: boolean) => {
      if (!current || current.kind !== 'confirm') return;
      current.resolve(accepted);
      dequeue();
    },
    [current, dequeue],
  );

  const closePrompt = useCallback(
    (accepted: boolean) => {
      if (!current || current.kind !== 'prompt') return;
      if (accepted) {
        const value = promptValue.trim();
        if (current.options.required !== false && !value) return;
        current.resolve(value);
      } else {
        current.resolve(null);
      }
      dequeue();
    },
    [current, dequeue, promptValue],
  );

  useEffect(() => {
    if (!current) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (current.kind === 'alert') closeAlert();
        else if (current.kind === 'confirm') closeConfirm(false);
        else closePrompt(false);
      }
      if (e.key === 'Enter' && current.kind === 'alert') {
        e.preventDefault();
        closeAlert();
      }
    };
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [current, closeAlert, closeConfirm, closePrompt]);

  const tone: DialogTone = current && current.kind !== 'alert' ? (current.options.tone ?? 'default') : 'default';
  const iconWrapClass =
    current?.kind === 'alert'
      ? 'bg-cac-green3 text-cac-green'
      : tone === 'danger'
        ? 'bg-red-100 text-red-800'
        : 'bg-[#edf4f7] text-cac-navy';

  const overlay =
    current && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-[rgba(10,36,64,.45)] p-3 sm:items-center sm:p-6"
            role="presentation"
          >
            <div
              ref={panelRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={current.options.message ? descId : undefined}
              tabIndex={-1}
              className="flex w-full max-w-md flex-col overflow-hidden rounded-[19px] border border-cac-line bg-white shadow-cac outline-none"
            >
              <div className="px-5 pt-5 md:px-6">
                <div className="flex items-start gap-3">
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-2xl ${iconWrapClass}`}
                    aria-hidden
                  >
                    {toneIcon(current.kind, tone)}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-mini font-extrabold tracking-[1.4px] text-cac-green uppercase">
                      {badgeFor(current.kind, tone, labels, current.options.badge)}
                    </p>
                    <h2 id={titleId} className="mt-1 text-grande leading-tight font-bold text-cac-navy">
                      {current.options.title}
                    </h2>
                  </div>
                </div>
                {current.options.message ? (
                  <p id={descId} className="mt-3 text-media leading-relaxed text-cac-muted">
                    {current.options.message}
                  </p>
                ) : null}
                {current.kind === 'prompt' ? (
                  <form
                    className="mt-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      closePrompt(true);
                    }}
                  >
                    <Input
                      label={current.options.inputLabel ?? labels.promptLabel}
                      value={promptValue}
                      placeholder={current.options.placeholder}
                      onChange={(e) => setPromptValue(e.target.value)}
                      autoFocus
                      required={current.options.required !== false}
                    />
                  </form>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-cac-line bg-[#fbfcfb] px-5 py-3 md:px-6">
                {current.kind === 'alert' ? (
                  <Button type="button" onClick={closeAlert}>
                    {current.options.confirmLabel ?? labels.ok}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => (current.kind === 'prompt' ? closePrompt(false) : closeConfirm(false))}
                    >
                      {current.options.cancelLabel ?? labels.cancel}
                    </Button>
                    <Button
                      type="button"
                      variant={tone === 'danger' ? 'danger' : 'primary'}
                      onClick={() => (current.kind === 'prompt' ? closePrompt(true) : closeConfirm(true))}
                    >
                      {current.options.confirmLabel ?? labels.confirm}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <DialogContext.Provider value={api}>
      {children}
      {overlay}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return ctx;
}
