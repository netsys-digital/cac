import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type Organization } from '../../api/catalogApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';

export function NewTechnologyPage() {
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
      { title: t('catalog.tipTech1Title'), body: t('catalog.tipTech1Body') },
      { title: t('catalog.tipTech2Title'), body: t('catalog.tipTech2Body') },
      { title: t('catalog.tipTech3Title'), body: t('catalog.tipTech3Body') },
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
      const created = await catalogApi.createTechnology(accessToken, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        problemStatement: String(form.get('problemStatement')),
        howItWorks: String(form.get('howItWorks')),
        videoUrl: String(form.get('videoUrl') || '').trim() || undefined,
        organizationId: String(form.get('organizationId')),
        country: String(form.get('country') || 'BR'),
        tags: String(form.get('tags') || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      await catalogApi.submitTechnology(accessToken, created.technology.id);
      setMessage(t('catalog.techSubmitted', { slug: created.technology.slug }));
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    }
  }

  return (
    <FormPage
      badge="01 · solução"
      title={t('catalog.newTech')}
      description={t('catalog.techDesc')}
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
        <TextArea
          label={t('catalog.problem')}
          hint={t('catalog.problemHint')}
          name="problemStatement"
          required
          rows={4}
        />
      </FieldFull>
      <FieldFull>
        <TextArea label={t('catalog.how')} hint={t('catalog.howHint')} name="howItWorks" required rows={4} />
      </FieldFull>
      <FieldFull>
        <Input
          label={t('catalog.videoUrl')}
          hint={t('catalog.videoUrlHint')}
          name="videoUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
        />
      </FieldFull>
      <Input label={t('catalog.country')} hint={t('catalog.countryHint')} name="country" defaultValue="BR" />
      <Input label={t('catalog.tags')} hint={t('catalog.tagsHint')} name="tags" placeholder="pasture, drought" />
    </FormPage>
  );
}
