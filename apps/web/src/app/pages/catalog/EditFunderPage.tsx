import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { fundingWizardApi, type MyFunder } from '../../api/fundingWizardApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';
import { INLINE_TOOLS, RichTextArea } from '../../components/forms/RichTextArea';
import { pickCoverFile, RepresentativeImageField } from '../../components/forms/RepresentativeImageField';
import { RegionCountryFields } from '../../components/forms/RegionCountryFields';
import { useMyOrganizations } from '../../hooks/useMyOrganizations';

export function EditFunderPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { orgs } = useMyOrganizations(accessToken);
  const [item, setItem] = useState<MyFunder | null>(null);
  const [organizationId, setOrganizationId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    void fundingWizardApi
      .myFunders(accessToken)
      .then((res) => {
        const found = res.items.find((row) => row.id === id) ?? null;
        setItem(found);
        setOrganizationId(found?.organizationId ?? '');
        if (found && found.status !== 'DRAFT') setError(t('catalog.funderNotEditable'));
      })
      .catch(() => setError(t('catalog.funderError')))
      .finally(() => setLoading(false));
  }, [accessToken, id, t]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken || !item || item.status !== 'DRAFT') return;
    setError('');
    const form = new FormData(e.currentTarget);
    const logo = pickCoverFile(form, 'logo');
    if (!logo && !item.logoUrl) {
      setError(t('catalog.funderLogoRequired'));
      return;
    }
    try {
      await fundingWizardApi.updateFunder(accessToken, item.id, {
        name: String(form.get('name')),
        summary: String(form.get('summary')),
        interestAreas: String(form.get('interestAreas')),
        website: String(form.get('website') || ''),
        contactName: String(form.get('contactName')),
        contactEmail: String(form.get('contactEmail')),
        country: String(form.get('country')),
        region: String(form.get('region')),
        organizationId: organizationId || null,
      });
      if (logo) await fundingWizardApi.uploadLogo(accessToken, item.id, logo);
      await fundingWizardApi.submitFunder(accessToken, item.id);
      navigate('/my/funders');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('catalog.funderError'));
    }
  }

  if (loading) return <p className="text-pequena text-cac-muted">{t('mine.loading')}</p>;
  if (!item || item.status !== 'DRAFT') {
    return (
      <p className="text-pequena text-cac-muted">
        {item ? t('catalog.funderNotEditable') : t('mine.notFound')} —{' '}
        <Link to="/my/funders">{t('catalog.myFunders')}</Link>
      </p>
    );
  }

  return (
    <FormPage
      badge="03 · financiamento"
      title={t('catalog.editFunder')}
      description={item.curationNote ? `${t('mine.curationNoteTitle')}: ${item.curationNote}` : t('catalog.funderDesc')}
      tips={[]}
      onSubmit={onSubmit}
      submitLabel={t('catalog.funderSubmit')}
      error={error}
    >
      <FieldFull>
        <Input label={t('admin.fundersName')} name="name" required defaultValue={item.name} />
      </FieldFull>
      <FieldFull>
        <RepresentativeImageField
          name="logo"
          currentUrl={item.logoUrl}
          label={t('admin.fundersLogo')}
          hint={t('admin.fundersLogoHint')}
          emptyLabel={t('admin.fundersLogoEmpty')}
        />
      </FieldFull>
      <RegionCountryFields
        defaultRegion={item.region ?? 'south_america'}
        defaultCountry={item.country ?? 'BR'}
        regionLabel={t('admin.fundersRegion')}
        countryLabel={t('admin.fundersCountry')}
      />
      <FieldFull>
        <RichTextArea
          label={t('admin.fundersSummary')}
          name="summary"
          required
          rows={4}
          tools={INLINE_TOOLS}
          defaultValue={item.summary}
        />
      </FieldFull>
      <FieldFull>
        <RichTextArea
          label={t('admin.fundersInterest')}
          hint={t('admin.fundersInterestHint')}
          name="interestAreas"
          required
          rows={4}
          tools={INLINE_TOOLS}
          defaultValue={item.interestAreas ?? ''}
        />
      </FieldFull>
      <FieldFull>
        <Input
          label={t('admin.fundersWebsite')}
          hint={t('admin.fundersWebsiteHint')}
          name="website"
          required
          defaultValue={item.website ?? ''}
          placeholder="https://"
        />
      </FieldFull>
      <FieldFull>
        <Input label={t('admin.fundersContactName')} name="contactName" required defaultValue={item.contactName ?? ''} />
      </FieldFull>
      <FieldFull>
        <Input
          label={t('admin.fundersContactEmail')}
          name="contactEmail"
          type="email"
          required
          defaultValue={item.contactEmail ?? ''}
        />
      </FieldFull>
      <FieldFull>
        <SelectField
          label={t('admin.fundersOrg')}
          hint={t('catalog.funderOrgHint')}
          value={organizationId}
          onChange={setOrganizationId}
        >
          <option value="">{t('admin.fundersOrgNone')}</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </SelectField>
      </FieldFull>
    </FormPage>
  );
}
