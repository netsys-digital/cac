import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type Organization } from '../../api/catalogApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';

export function NewChallengePage() {
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
      { title: t('catalog.tipCh1Title'), body: t('catalog.tipCh1Body') },
      { title: t('catalog.tipCh2Title'), body: t('catalog.tipCh2Body') },
      { title: t('catalog.tipCh3Title'), body: t('catalog.tipCh3Body') },
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
      const created = await catalogApi.createChallenge(accessToken, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        needType: String(form.get('needType')),
        organizationId: String(form.get('organizationId')),
        country: String(form.get('country') || 'BR'),
        status: 'DRAFT',
      });
      await catalogApi.submitChallenge(accessToken, created.challenge.id);
      setMessage(t('catalog.challengeSubmitted'));
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    }
  }

  return (
    <FormPage
      badge="02 · desafio"
      title={t('catalog.newChallenge')}
      description={t('catalog.challengeDesc')}
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
        <TextArea label={t('catalog.summary')} hint={t('catalog.summaryHint')} name="summary" required rows={4} />
      </FieldFull>
      <SelectField
        label={t('catalog.needType')}
        hint={t('catalog.needTypeHint')}
        name="needType"
        defaultValue="TECHNOLOGY"
      >
        <option value="TECHNOLOGY">{t('catalog.needTechnology')}</option>
        <option value="KNOWLEDGE">{t('catalog.needKnowledge')}</option>
        <option value="PARTNERSHIP">{t('catalog.needPartnership')}</option>
        <option value="FUNDING">{t('catalog.needFunding')}</option>
        <option value="TRAINING">{t('catalog.needTraining')}</option>
        <option value="RESEARCH">{t('catalog.needResearch')}</option>
        <option value="EQUIPMENT">{t('catalog.needEquipment')}</option>
      </SelectField>
      <Input label={t('catalog.country')} hint={t('catalog.countryHint')} name="country" defaultValue="BR" />
    </FormPage>
  );
}
