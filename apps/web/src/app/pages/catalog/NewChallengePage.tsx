import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type Organization } from '../../api/catalogApi';

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
    <form onSubmit={onSubmit} className="max-w-xl space-y-3 rounded-2xl border border-cac-line bg-white p-[23px] shadow-cac">
      <h1 className="text-[20px] font-black text-cac-navy">{t('catalog.newChallenge')}</h1>
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
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t('catalog.needType')}</span>
        <select name="needType" className="rounded-md border border-cac-line px-3 py-2" defaultValue="TECHNOLOGY">
          <option value="TECHNOLOGY">TECHNOLOGY</option>
          <option value="KNOWLEDGE">KNOWLEDGE</option>
          <option value="PARTNERSHIP">PARTNERSHIP</option>
          <option value="FUNDING">FUNDING</option>
          <option value="TRAINING">TRAINING</option>
          <option value="RESEARCH">RESEARCH</option>
          <option value="EQUIPMENT">EQUIPMENT</option>
        </select>
      </label>
      <Input label={t('catalog.country')} name="country" defaultValue="BR" />
      {error ? <p className="text-[11px] text-red-700">{error}</p> : null}
      {message ? <p className="text-[11px] text-cac-forest">{message}</p> : null}
      <Button type="submit">{t('catalog.saveSubmit')}</Button>
    </form>
  );
}
