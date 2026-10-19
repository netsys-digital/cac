import { type FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { fundingWizardApi } from '../../api/fundingWizardApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';
import { INLINE_TOOLS, RichTextArea } from '../../components/forms/RichTextArea';
import { pickCoverFile, RepresentativeImageField } from '../../components/forms/RepresentativeImageField';
import { RegionCountryFields } from '../../components/forms/RegionCountryFields';
import { useMyOrganizations } from '../../hooks/useMyOrganizations';

export function NewFunderPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { orgs } = useMyOrganizations(accessToken);
  const [organizationId, setOrganizationId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const tips = useMemo(
    () => [
      { title: t('catalog.tipFunder1Title'), body: t('catalog.tipFunder1Body') },
      { title: t('catalog.tipFunder2Title'), body: t('catalog.tipFunder2Body') },
      { title: t('catalog.tipFunder3Title'), body: t('catalog.tipFunder3Body') },
    ],
    [t],
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken) return;
    setError('');
    setMessage('');
    const form = new FormData(e.currentTarget);
    const formEl = e.currentTarget;
    const logo = pickCoverFile(form, 'logo');
    if (!logo) {
      setError(t('catalog.funderLogoRequired'));
      return;
    }
    try {
      const created = await fundingWizardApi.createFunder(accessToken, {
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
      await fundingWizardApi.uploadLogo(accessToken, created.funder.id, logo);
      setMessage(t('catalog.funderSubmitted'));
      setOrganizationId('');
      formEl.reset();
    } catch (err) {
      const text = err instanceof Error ? err.message : '';
      setError(text.includes('slug_taken') ? t('admin.fundersSlugTaken') : text || t('catalog.funderError'));
    }
  }

  return (
    <FormPage
      badge="03 · financiamento"
      title={t('catalog.newFunder')}
      description={t('catalog.funderDesc')}
      tips={tips}
      onSubmit={onSubmit}
      submitLabel={t('catalog.funderSubmit')}
      error={error}
      message={message}
    >
      <FieldFull>
        <Input label={t('admin.fundersName')} name="name" required />
      </FieldFull>
      <FieldFull>
        <RepresentativeImageField
          name="logo"
          label={t('admin.fundersLogo')}
          hint={t('admin.fundersLogoHint')}
          emptyLabel={t('admin.fundersLogoEmpty')}
        />
      </FieldFull>
      <RegionCountryFields
        defaultRegion="south_america"
        defaultCountry="BR"
        regionLabel={t('admin.fundersRegion')}
        countryLabel={t('admin.fundersCountry')}
      />
      <FieldFull>
        <RichTextArea
          label={t('admin.fundersSummary')}
          hint={t('admin.fundersSummaryHint')}
          name="summary"
          required
          rows={4}
          tools={INLINE_TOOLS}
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
        />
      </FieldFull>
      <FieldFull>
        <Input label={t('admin.fundersWebsite')} hint={t('admin.fundersWebsiteHint')} name="website" required placeholder="https://" />
      </FieldFull>
      <FieldFull>
        <Input label={t('admin.fundersContactName')} name="contactName" required />
      </FieldFull>
      <FieldFull>
        <Input label={t('admin.fundersContactEmail')} name="contactEmail" type="email" required />
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
      <p className="text-mini text-cac-muted">
        <Link to="/my/funders" className="font-bold text-cac-green hover:underline">
          {t('catalog.myFundersLink')}
        </Link>
      </p>
    </FormPage>
  );
}
