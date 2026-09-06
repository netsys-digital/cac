import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type Organization } from '../../api/catalogApi';

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
    <form onSubmit={onSubmit} className="max-w-xl space-y-3 rounded-xl border border-cac-line bg-white/80 p-6">
      <h1 className="font-display text-2xl text-cac-ink">{t('catalog.newTech')}</h1>
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
      <Input label={t('catalog.problem')} name="problemStatement" required />
      <Input label={t('catalog.how')} name="howItWorks" required />
      <Input label={t('catalog.country')} name="country" defaultValue="BR" />
      <Input label={t('catalog.tags')} name="tags" placeholder="pasture, drought" />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-cac-forest">{message}</p> : null}
      <Button type="submit">{t('catalog.saveSubmit')}</Button>
    </form>
  );
}
