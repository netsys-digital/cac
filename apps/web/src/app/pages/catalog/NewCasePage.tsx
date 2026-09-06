import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type Organization } from '../../api/catalogApi';
import { fundingWizardApi } from '../../api/fundingWizardApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';

export function NewCasePage() {
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
      { title: t('catalog.tipCase1Title'), body: t('catalog.tipCase1Body') },
      { title: t('catalog.tipCase2Title'), body: t('catalog.tipCase2Body') },
      { title: t('catalog.tipCase3Title'), body: t('catalog.tipCase3Body') },
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
      const needs = String(form.get('needs') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((needType) => ({ needType, detail: '' }));
      const evidenceNotes = String(form.get('evidence') || '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      const created = await fundingWizardApi.createCase(accessToken, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        context: String(form.get('context') || ''),
        outcomes: String(form.get('outcomes') || ''),
        organizationId: String(form.get('organizationId')),
        country: String(form.get('country') || 'MZ'),
        needs,
        evidenceNotes,
      });
      await fundingWizardApi.submitCase(accessToken, created.successCase.id);
      setMessage(t('catalog.caseSubmitted', { slug: created.successCase.slug }));
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    }
  }

  return (
    <FormPage
      badge="04 · caso"
      title={t('catalog.newCase')}
      description={t('catalog.caseDesc')}
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
        <TextArea label={t('catalog.context')} hint={t('catalog.contextHint')} name="context" rows={4} />
      </FieldFull>
      <FieldFull>
        <TextArea label={t('catalog.outcomes')} hint={t('catalog.outcomesHint')} name="outcomes" rows={3} />
      </FieldFull>
      <Input label={t('catalog.country')} hint={t('catalog.countryHint')} name="country" defaultValue="MZ" />
      <Input
        label={t('catalog.needs')}
        hint={t('catalog.needsHint')}
        name="needs"
        placeholder="FUNDING,PARTNERSHIP"
      />
      <FieldFull>
        <TextArea
          label={t('catalog.evidence')}
          hint={t('catalog.evidenceHint')}
          name="evidence"
          rows={3}
          placeholder="evidência 1 | evidência 2"
        />
      </FieldFull>
    </FormPage>
  );
}
