import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi } from '../../api/catalogApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';
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

function parseTags(raw: FormDataEntryValue | null): string[] {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function NewTechnologyPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { loading, orgs, allOrgs, organizationId, setOrganizationId } = useMyOrganizations(
    accessToken,
    'TECHNOLOGY',
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    const orgId = String(form.get('organizationId') || organizationId);
    if (!orgId) {
      setError(t('catalog.needOrg'));
      return;
    }
    const tags = parseTags(form.get('tags'));
    if (!tags.length) {
      setError(t('catalog.tagsRequired'));
      return;
    }
    const cover = pickCoverFile(form);
    try {
      const created = await catalogApi.createTechnology(accessToken, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        problemStatement: String(form.get('problemStatement')),
        howItWorks: String(form.get('howItWorks')),
        videoUrl: String(form.get('videoUrl') || '').trim() || undefined,
        organizationId: orgId,
        country: String(form.get('country')),
        region: String(form.get('region')),
        maturity: String(form.get('maturity')),
        tags,
      });
      if (cover) {
        await catalogApi.uploadCover(accessToken, 'technologies', created.technology.id, cover);
      }
      await catalogApi.submitTechnology(accessToken, created.technology.id);
      setMessage(t('catalog.techSubmitted', { slug: created.technology.slug }));
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    }
  }

  if (loading) return <LinkedOrganizationsLoading />;
  if (allOrgs.length === 0) {
    return <NeedLinkedOrganization badge="01 · solução" title={t('catalog.newTech')} />;
  }
  if (orgs.length === 0) {
    return (
      <NeedOrgPublishKind
        badge="01 · solução"
        title={t('catalog.newTech')}
        kindLabel={t('admin.publishKind.TECHNOLOGY')}
      />
    );
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
        <RepresentativeImageField />
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
      <RegionCountryFields defaultRegion="south_america" defaultCountry="BR" />
      <SelectField
        label={t('catalog.maturity')}
        hint={t('catalog.maturityHint')}
        name="maturity"
        required
        defaultValue="READY_FOR_IMPLEMENTATION"
      >
        <option value="RESEARCH">{t('catalog.maturityResearch')}</option>
        <option value="VALIDATION">{t('catalog.maturityValidation')}</option>
        <option value="DEMONSTRATION">{t('catalog.maturityDemonstration')}</option>
        <option value="READY_FOR_IMPLEMENTATION">{t('catalog.maturityReady')}</option>
        <option value="AT_SCALE">{t('catalog.maturityScale')}</option>
      </SelectField>
      <FieldFull>
        <Input
          label={t('catalog.tags')}
          hint={t('catalog.tagsHint')}
          name="tags"
          placeholder="pasture, drought"
          required
        />
      </FieldFull>
    </FormPage>
  );
}
