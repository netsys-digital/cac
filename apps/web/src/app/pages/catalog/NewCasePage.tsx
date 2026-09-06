import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type Organization } from '../../api/catalogApi';
import { fundingWizardApi } from '../../api/fundingWizardApi';

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
    <form onSubmit={onSubmit} className="max-w-xl space-y-3 rounded-xl border border-cac-line bg-white/80 p-6">
      <h1 className="font-display text-2xl text-cac-ink">{t('catalog.newCase')}</h1>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t('catalog.organization')}</span>
        <select name="organizationId" required className="rounded-md border border-cac-line px-3 py-2">
          <option value="">{t('rep.selectOrg')}</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
      <Input label={t('catalog.title')} name="title" required />
      <Input label={t('catalog.summary')} name="summary" required />
      <Input label={t('catalog.context')} name="context" />
      <Input label={t('catalog.outcomes')} name="outcomes" />
      <Input label={t('catalog.country')} name="country" defaultValue="MZ" />
      <Input label={t('catalog.needs')} name="needs" placeholder="FUNDING,PARTNERSHIP,EQUIPMENT" />
      <Input label={t('catalog.evidence')} name="evidence" placeholder="evidência 1 | evidência 2" />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-cac-forest">{message}</p> : null}
      <Button type="submit">{t('catalog.saveSubmit')}</Button>
    </form>
  );
}
