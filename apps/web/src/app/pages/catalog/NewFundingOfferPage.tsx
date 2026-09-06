import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type Organization } from '../../api/catalogApi';
import { fundingWizardApi } from '../../api/fundingWizardApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';

export function NewFundingOfferPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    void catalogApi.listOrganizations(accessToken).then((res) => setOrgs(res.items));
  }, [accessToken]);

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
    try {
      const created = await fundingWizardApi.createOffer(accessToken, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        whatFunds: String(form.get('whatFunds') || ''),
        criteria: String(form.get('criteria') || ''),
        amountRange: String(form.get('amountRange') || ''),
        officialUrl: String(form.get('officialUrl') || ''),
        deadline: String(form.get('deadline') || '') || undefined,
        organizationId: String(form.get('organizationId')),
        country: String(form.get('country') || 'BR'),
      });
      await fundingWizardApi.submitOffer(accessToken, created.offer.id);
      setMessage(t('catalog.offerSubmitted', { slug: created.offer.slug }));
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    }
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
        <SelectField
          label={t('catalog.organization')}
          hint={t('catalog.organizationHint')}
          name="organizationId"
          required
        >
          <option value="">{t('rep.selectOrg')}</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </SelectField>
      </FieldFull>
      <FieldFull>
        <Input label={t('catalog.title')} hint={t('catalog.titleHint')} name="title" required />
      </FieldFull>
      <FieldFull>
        <TextArea label={t('catalog.summary')} hint={t('catalog.summaryHint')} name="summary" required rows={3} />
      </FieldFull>
      <FieldFull>
        <TextArea label={t('catalog.whatFunds')} hint={t('catalog.whatFundsHint')} name="whatFunds" rows={3} />
      </FieldFull>
      <FieldFull>
        <TextArea label={t('catalog.criteria')} hint={t('catalog.criteriaHint')} name="criteria" rows={3} />
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
      <Input label={t('catalog.country')} hint={t('catalog.countryHint')} name="country" defaultValue="BR" />
    </FormPage>
  );
}
