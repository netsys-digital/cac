import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { ConnectionObjective } from '@cac/shared';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi } from '../../api/catalogApi';
import { connectionsApi } from '../../api/connectionsApi';

export function NewConnectionPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const targetType = params.get('targetType') ?? 'TECHNOLOGY';
  const targetId = params.get('targetId') ?? '';
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [requesterOrgId, setRequesterOrgId] = useState('');
  const [objective, setObjective] = useState<string>(ConnectionObjective.KNOW_MORE);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const objectives = useMemo(
    () => [
      { value: ConnectionObjective.KNOW_MORE, label: t('conn.objKnow') },
      { value: ConnectionObjective.IMPLEMENT_SOLUTION, label: t('conn.objImplement') },
      { value: ConnectionObjective.PARTNERSHIP, label: t('conn.objPartner') },
      { value: ConnectionObjective.FUNDING, label: t('conn.objFunding') },
    ],
    [t],
  );

  useEffect(() => {
    if (!accessToken) return;
    void catalogApi.listOrganizations(accessToken).then((res) => {
      setOrgs(res.items);
      if (res.items[0]) setRequesterOrgId(res.items[0].id);
    });
  }, [accessToken]);

  useEffect(() => {
    const intent = params.get('intent');
    if (intent !== 'save' || !accessToken || !targetId) return;
    void connectionsApi
      .saveItem(accessToken, { targetType, targetId })
      .then(() => setOk(t('conn.saved')))
      .catch(() => undefined);
  }, [accessToken, params, targetId, targetType, t]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !targetId || !requesterOrgId) {
      setError(t('conn.missing'));
      return;
    }
    setError('');
    try {
      await connectionsApi.create(accessToken, {
        requesterOrgId,
        targetType,
        targetId,
        objective,
        message: message || undefined,
      });
      setOk(t('conn.created'));
      setTimeout(() => navigate('/my/connections'), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('conn.error'));
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4 rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
      <h1 className="text-[20px] font-black text-cac-navy">{t('conn.newTitle')}</h1>
      <p className="text-[11px] text-cac-muted">
        {t('conn.targetMeta', { type: targetType, id: targetId || '—' })}
      </p>
      <label className="block text-[11px] font-black text-cac-navy">
        {t('conn.requesterOrg')}
        <select
          className="mt-1 w-full rounded-lg border border-cac-line px-3 py-2 text-[11px]"
          value={requesterOrgId}
          onChange={(e) => setRequesterOrgId(e.target.value)}
          required
        >
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-[11px] font-black text-cac-navy">
        {t('conn.objective')}
        <select
          className="mt-1 w-full rounded-lg border border-cac-line px-3 py-2 text-[11px]"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
        >
          {objectives.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <Input
        label={t('conn.message')}
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error ? <p className="text-[11px] text-red-700">{error}</p> : null}
      {ok ? <p className="text-[11px] text-cac-green">{ok}</p> : null}
      <Button type="submit" className="w-full">
        {t('conn.submit')}
      </Button>
    </form>
  );
}
