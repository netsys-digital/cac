import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

type OrganizationLogoFieldProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
};

const ACCEPT = 'image/jpeg,image/png,image/webp';

export function OrganizationLogoField({ file, onChange, required }: OrganizationLogoFieldProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [tooLarge, setTooLarge] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
        {t('rep.orgLogo')}
        {required ? ' *' : ''}
      </label>
      <p className="text-mini leading-snug text-cac-muted">{t('rep.orgLogoHint')}</p>
      <div className="flex flex-wrap items-start gap-3">
        <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[14px] border border-cac-line bg-[#edf1f3]">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-contain p-1.5" />
          ) : (
            <span className="px-1 text-center text-mini text-cac-muted">{t('rep.orgLogoEmpty')}</span>
          )}
        </div>
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
      </div>
      {tooLarge ? <p className="text-mini text-red-700">{t('rep.docTooLarge')}</p> : null}
    </div>
  );
}
