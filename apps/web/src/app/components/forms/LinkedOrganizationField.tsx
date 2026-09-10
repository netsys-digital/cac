import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MyOrganization } from '../../hooks/useMyOrganizations';
import { SelectField } from './FormPage';

type LinkedOrganizationFieldProps = {
  orgs: MyOrganization[];
  value: string;
  onChange: (organizationId: string) => void;
  name?: string;
};

/** Select só com 2+ vínculos; com 1, mostra o nome e envia o id oculto. */
export function LinkedOrganizationField({
  orgs,
  value,
  onChange,
  name = 'organizationId',
}: LinkedOrganizationFieldProps) {
  const { t } = useTranslation();
  const single = orgs.length === 1 ? orgs[0] : null;

  if (single) {
    return (
      <div className="flex flex-col gap-1">
        <span className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
          {t('catalog.organization')}
        </span>
        <span className="text-mini leading-snug text-cac-muted">{t('catalog.organizationSingleHint')}</span>
        <p className="rounded-lg border border-cac-line bg-[#fbfcfb] px-3 py-2 text-pequena font-bold text-cac-navy">
          {single.name}
        </p>
        <input type="hidden" name={name} value={single.id} />
      </div>
    );
  }

  return (
    <SelectField
      label={t('catalog.organization')}
      hint={t('catalog.organizationHint')}
      name={name}
      value={value}
      onChange={onChange}
      required
    >
      {orgs.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </SelectField>
  );
}

type NeedLinkedOrganizationProps = {
  badge: string;
  title: string;
};

export function NeedLinkedOrganization({ badge, title }: NeedLinkedOrganizationProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-cac-line bg-white p-6 shadow-cac">
      <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">{badge}</p>
      <h1 className="mt-2 text-grande font-bold text-cac-navy">{title}</h1>
      <p className="mt-2 max-w-2xl text-media text-cac-muted">{t('catalog.needOrgBody')}</p>
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-pequena font-medium text-amber-900">
        {t('catalog.needOrg')}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to="/org/representation"
          className="inline-flex rounded-[12px] bg-cac-navy px-4 py-2.5 text-media font-extrabold text-white transition hover:bg-cac-green2"
        >
          {t('catalog.goRepresentation')}
        </Link>
        <Link
          to="/"
          className="inline-flex rounded-[12px] border border-cac-line bg-white px-4 py-2.5 text-media font-extrabold text-cac-navy transition hover:bg-cac-bg"
        >
          {t('nav.dashboard')}
        </Link>
      </div>
    </div>
  );
}

export function NeedOrgPublishKind({
  badge,
  title,
  kindLabel,
}: {
  badge: string;
  title: string;
  kindLabel: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-cac-line bg-white p-6 shadow-cac">
      <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">{badge}</p>
      <h1 className="mt-2 text-grande font-bold text-cac-navy">{title}</h1>
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-pequena font-medium text-amber-900">
        {t('catalog.needOrgKind', { kind: kindLabel })}
      </p>
      <div className="mt-5">
        <Link
          to="/"
          className="inline-flex rounded-[12px] border border-cac-line bg-white px-4 py-2.5 text-media font-extrabold text-cac-navy transition hover:bg-cac-bg"
        >
          {t('nav.dashboard')}
        </Link>
      </div>
    </div>
  );
}

export function LinkedOrganizationsLoading() {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-cac-line bg-white p-5 text-media text-cac-muted shadow-cac">
      {t('dash.loading')}
    </div>
  );
}
