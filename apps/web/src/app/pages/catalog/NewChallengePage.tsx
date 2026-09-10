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

export function NewChallengePage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { loading, orgs, allOrgs, organizationId, setOrganizationId } = useMyOrganizations(
    accessToken,
    'CHALLENGE',
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      const created = await catalogApi.createChallenge(accessToken, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        context: String(form.get('context')),
        needType: String(form.get('needType')),
        organizationId: orgId,
        country: String(form.get('country')),
        region: String(form.get('region')),
        tags,
        status: 'DRAFT',
      });
      if (cover) {
        await catalogApi.uploadCover(accessToken, 'challenges', created.challenge.id, cover);
      }
      await catalogApi.submitChallenge(accessToken, created.challenge.id);
      setMessage(t('catalog.challengeSubmitted'));
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    }
  }

  if (loading) return <LinkedOrganizationsLoading />;
  if (allOrgs.length === 0) {
    return <NeedLinkedOrganization badge="02 · desafio" title={t('catalog.newChallenge')} />;
  }
  if (orgs.length === 0) {
    return (
      <NeedOrgPublishKind
        badge="02 · desafio"
        title={t('catalog.newChallenge')}
        kindLabel={t('admin.publishKind.CHALLENGE')}
      />
    );
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
        <TextArea label={t('catalog.summary')} hint={t('catalog.summaryHint')} name="summary" required rows={4} />
      </FieldFull>
      <FieldFull>
        <TextArea
          label={t('catalog.context')}
          hint={t('catalog.contextChallengeHint')}
          name="context"
          required
          rows={4}
        />
      </FieldFull>
      <FieldFull>
        <RepresentativeImageField />
      </FieldFull>
      <SelectField
        label={t('catalog.needType')}
        hint={t('catalog.needTypeHint')}
        name="needType"
        required
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
      <RegionCountryFields defaultRegion="south_america" defaultCountry="BR" />
      <FieldFull>
        <Input
          label={t('catalog.tags')}
          hint={t('catalog.tagsHint')}
          name="tags"
          placeholder="drought, pasture"
          required
        />
      </FieldFull>
    </FormPage>
  );
}
