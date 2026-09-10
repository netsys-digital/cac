import { ORG_PUBLISH_KINDS, type OrgPublishKind } from '@cac/shared';
import { useTranslation } from 'react-i18next';

type PublishKindsPickerProps = {
  value: OrgPublishKind[];
  onChange: (next: OrgPublishKind[]) => void;
  idPrefix?: string;
};

export function PublishKindsPicker({ value, onChange, idPrefix = 'pk' }: PublishKindsPickerProps) {
  const { t } = useTranslation();

  function toggle(kind: OrgPublishKind) {
    if (value.includes(kind)) onChange(value.filter((k) => k !== kind));
    else onChange([...value, kind]);
  }

  return (
    <fieldset className="rounded-xl border border-cac-line bg-[#fbfcfb] px-3 py-3">
      <legend className="px-1 text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
        {t('admin.publishKindsLabel')}
      </legend>
      <p className="mb-2 text-pequena text-cac-muted">{t('admin.publishKindsHint')}</p>
      <div className="flex flex-wrap gap-2">
        {ORG_PUBLISH_KINDS.map((kind) => {
          const checked = value.includes(kind);
          const id = `${idPrefix}-${kind}`;
          return (
            <label
              key={kind}
              htmlFor={id}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-pequena font-bold transition ${
                checked
                  ? 'border-cac-green bg-cac-green3 text-cac-navy'
                  : 'border-cac-line bg-white text-cac-muted hover:border-cac-green/40'
              }`}
            >
              <input
                id={id}
                type="checkbox"
                className="accent-cac-green"
                checked={checked}
                onChange={() => toggle(kind)}
              />
              {t(`admin.publishKind.${kind}`)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
