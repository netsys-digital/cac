import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi } from '../../api/catalogApi';
import { fundingWizardApi } from '../../api/fundingWizardApi';
import { FieldFull, FormPage } from '../../components/forms/FormPage';
import {
  LinkedOrganizationField,
  LinkedOrganizationsLoading,
  NeedLinkedOrganization,
  NeedOrgPublishKind,
} from '../../components/forms/LinkedOrganizationField';
import {
  pickCoverFile,
  RepresentativeImageField,
} from '../../components/forms/RepresentativeImageField';
import { RegionCountryFields } from '../../components/forms/RegionCountryFields';
import { useMyOrganizations } from '../../hooks/useMyOrganizations';

export function NewFundingOfferPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { loading, orgs, allOrgs, organizationId, setOrganizationId } = useMyOrganizations(
    accessToken,
    'FUNDING_OFFER',
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const tips = useMemo(
    () => [
      { title: t('catalog.tipOffer1Title'), body: t('catalog.tipOffer1Body') },
      { title: t('catalog.tipOffer2Title'), body: t('catalog.tipOffer2Body') },
      { title: t('catalog.tipOffer3Title'), body: t('catalog.tipOffer3Body') },
    ],
    [t],
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken) return;
    setError('');
    setMessage('');
    const form = new FormData(e.currentTarget);
    const orgId = String(form.get('organizationId') || organizationId);
    if (!orgId) {
      setError(t('catalog.needOrg'));
      return;
    }
    const cover = pickCoverFile(form);
    try {
      const created = await fundingWizardApi.createOffer(accessToken, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        whatFunds: String(form.get('whatFunds')),
        criteria: String(form.get('criteria')),
        amountRange: String(form.get('amountRange') || ''),
        officialUrl: String(form.get('officialUrl') || ''),
        deadline: String(form.get('deadline') || '') || undefined,
        organizationId: orgId,
        country: String(form.get('country')),
        region: String(form.get('region')),
      });
      if (cover) {
        await catalogApi.uploadCover(accessToken, 'funding-offers', created.offer.id, cover);
      }
      await fundingWizardApi.submitOffer(accessToken, created.offer.id);
      setMessage(t('catalog.offerSubmitted', { slug: created.offer.slug }));
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    }
  }

  if (loading) return <LinkedOrganizationsLoading />;
  if (allOrgs.length === 0) {
    return <NeedLinkedOrganization badge="03 · financiamento" title={t('catalog.newOffer')} />;
  }
  if (orgs.length === 0) {
    return (
      <NeedOrgPublishKind
        badge="03 · financiamento"
        title={t('catalog.newOffer')}
        kindLabel={t('admin.publishKind.FUNDING_OFFER')}
      />
    );
  }

  return (
    <FormPage
      badge="03 · financiamento"
      title={t('catalog.newOffer')}
      description={t('catalog.offerDesc')}
      tips={tips}
      onSubmit={onSubmit}
      submitLabel={t('catalog.saveSubmit')}
      error={error}
      message={message}
    >
      <FieldFull>
        <LinkedOrganizationField
          orgs={orgs}
          value={organizationId}
          onChange={setOrganizationId}
        />
      </FieldFull>
      <FieldFull>
        <Input label={t('catalog.title')} hint={t('catalog.titleHint')} name="title" required />
      </FieldFull>
      <FieldFull>
        <TextArea label={t('catalog.summary')} hint={t('catalog.summaryHint')} name="summary" required rows={3} />
      </FieldFull>
      <FieldFull>
        <RepresentativeImageField />
      </FieldFull>
      <FieldFull>
        <TextArea
          label={t('catalog.whatFunds')}
          hint={t('catalog.whatFundsHint')}
          name="whatFunds"
          required
          rows={3}
        />
      </FieldFull>
      <FieldFull>
        <TextArea
          label={t('catalog.criteria')}
          hint={t('catalog.criteriaHint')}
          name="criteria"
          required
          rows={3}
        />
      </FieldFull>
      <Input
        label={t('catalog.amountRange')}
        hint={t('catalog.amountRangeHint')}
        name="amountRange"
        placeholder="USD 50k–250k"
      />
      <Input label={t('catalog.deadline')} hint={t('catalog.deadlineHint')} name="deadline" type="date" />
      <FieldFull>
        <Input label={t('catalog.officialUrl')} hint={t('catalog.officialUrlHint')} name="officialUrl" />
      </FieldFull>
      <RegionCountryFields defaultRegion="south_america" defaultCountry="BR" />
    </FormPage>
  );
}
