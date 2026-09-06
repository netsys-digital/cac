import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type Organization } from '../../api/catalogApi';
import { fundingWizardApi } from '../../api/fundingWizardApi';

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
    <form onSubmit={onSubmit} className="max-w-xl space-y-3 rounded-xl border border-cac-line bg-white/80 p-6">
      <h1 className="font-display text-2xl text-cac-ink">{t('catalog.newOffer')}</h1>
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
      <Input label={t('catalog.whatFunds')} name="whatFunds" />
      <Input label={t('catalog.criteria')} name="criteria" />
      <Input label={t('catalog.amountRange')} name="amountRange" placeholder="USD 50k–250k" />
      <Input label={t('catalog.officialUrl')} name="officialUrl" />
      <Input label={t('catalog.deadline')} name="deadline" type="date" />
      <Input label={t('catalog.country')} name="country" defaultValue="BR" />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-cac-forest">{message}</p> : null}
      <Button type="submit">{t('catalog.saveSubmit')}</Button>
    </form>
  );
}
