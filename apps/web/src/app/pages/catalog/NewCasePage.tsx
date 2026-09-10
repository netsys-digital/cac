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

export function NewCasePage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { loading, orgs, allOrgs, organizationId, setOrganizationId } = useMyOrganizations(
    accessToken,
    'SUCCESS_CASE',
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    const orgId = String(form.get('organizationId') || organizationId);
    if (!orgId) {
      setError(t('catalog.needOrg'));
      return;
    }
    const cover = pickCoverFile(form);
    const needs = String(form.get('needs') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((needType) => ({ needType, detail: '' }));
    if (!needs.length) {
      setError(t('catalog.needsRequired'));
      return;
    }
    try {
      const evidenceNotes = String(form.get('evidence') || '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      const created = await fundingWizardApi.createCase(accessToken, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        context: String(form.get('context')),
        outcomes: String(form.get('outcomes')),
        organizationId: orgId,
        country: String(form.get('country')),
        region: String(form.get('region')),
        needs,
        evidenceNotes,
      });
      if (cover) {
        await catalogApi.uploadCover(accessToken, 'success-cases', created.successCase.id, cover);
      }
      await fundingWizardApi.submitCase(accessToken, created.successCase.id);
      setMessage(t('catalog.caseSubmitted', { slug: created.successCase.slug }));
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    }
  }

  if (loading) return <LinkedOrganizationsLoading />;
  if (allOrgs.length === 0) {
    return <NeedLinkedOrganization badge="04 · caso" title={t('catalog.newCase')} />;
  }
  if (orgs.length === 0) {
    return (
      <NeedOrgPublishKind
        badge="04 · caso"
        title={t('catalog.newCase')}
        kindLabel={t('admin.publishKind.SUCCESS_CASE')}
      />
    );
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
        <TextArea label={t('catalog.context')} hint={t('catalog.contextHint')} name="context" required rows={4} />
      </FieldFull>
      <FieldFull>
        <TextArea label={t('catalog.outcomes')} hint={t('catalog.outcomesHint')} name="outcomes" required rows={3} />
      </FieldFull>
      <RegionCountryFields defaultRegion="africa" defaultCountry="MZ" />
      <Input
        label={t('catalog.needs')}
        hint={t('catalog.needsHint')}
        name="needs"
        placeholder="FUNDING,PARTNERSHIP"
        required
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
