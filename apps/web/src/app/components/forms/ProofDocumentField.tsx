import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ProofDocumentFieldProps = {
  label: string;
  hint: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
};

const ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';

export function ProofDocumentField({ label, hint, required, file, onChange }: ProofDocumentFieldProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const [tooLarge, setTooLarge] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
        {label}
        {required ? ' *' : ''}
      </label>
      <p className="text-mini leading-snug text-cac-muted">{hint}</p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={inputId}
          type="file"
          accept={ACCEPT}
          required={required}
          className="max-w-full text-pequena text-cac-navy file:mr-3 file:rounded-[10px] file:border-0 file:bg-cac-green3 file:px-3 file:py-2 file:text-pequena file:font-extrabold file:text-cac-navy hover:file:brightness-95"
          onChange={(e) => {
            const next = e.target.files?.[0] ?? null;
            if (next && next.size > 8 * 1024 * 1024) {
              setTooLarge(true);
              e.target.value = '';
              onChange(null);
              return;
            }
            setTooLarge(false);
            onChange(next);
          }}
        />
        {file ? (
          <span className="rounded-lg border border-cac-line bg-[#fbfcfb] px-2.5 py-1.5 text-mini font-bold text-cac-navy">
            {file.name}
          </span>
        ) : null}
      </div>
      {tooLarge ? <p className="text-mini text-red-700">{t('rep.docTooLarge')}</p> : null}
    </div>
  );
}
