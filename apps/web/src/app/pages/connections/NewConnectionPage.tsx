import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TextArea } from '@cac/ui';
import { ConnectionObjective } from '@cac/shared';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi } from '../../api/catalogApi';
import { connectionsApi } from '../../api/connectionsApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';

export function NewConnectionPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = Boolean((location.state as { justRegistered?: boolean } | null)?.justRegistered);
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

  const tips = useMemo(
    () => [
      { title: t('conn.tip1Title'), body: t('conn.tip1Body') },
      { title: t('conn.tip2Title'), body: t('conn.tip2Body') },
      { title: t('conn.tip3Title'), body: t('conn.tip3Body') },
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
    <div className="space-y-4">
      {justRegistered ? (
        <p className="rounded-[12px] border border-cac-green/30 bg-cac-green3 px-4 py-3 text-[12px] font-medium text-cac-navy">
          {t('auth.justRegisteredConnect')}
        </p>
      ) : null}
    <FormPage
      badge="conexão"
      title={t('conn.newTitle')}
      description={t('conn.newDesc')}
      tips={tips}
      onSubmit={onSubmit}
      submitLabel={t('conn.submit')}
      submitHint={t('conn.submitHint')}
      error={error}
      message={ok}
    >
      <FieldFull>
        <p className="rounded-lg border border-cac-line bg-[#fbfcfb] px-3 py-2 text-[11px] text-cac-muted">
          {t('conn.targetMeta', { type: targetType, id: targetId || '—' })}
        </p>
      </FieldFull>
      <FieldFull>
        <SelectField
          label={t('conn.requesterOrg')}
          hint={t('conn.requesterOrgHint')}
          value={requesterOrgId}
          onChange={setRequesterOrgId}
          required
        >
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </SelectField>
      </FieldFull>
      <FieldFull>
        <SelectField
          label={t('conn.objective')}
          hint={t('conn.objectiveHint')}
          value={objective}
          onChange={setObjective}
        >
          {objectives.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
      </FieldFull>
      <FieldFull>
        <TextArea
          label={t('conn.message')}
          hint={t('conn.messageHint')}
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />
      </FieldFull>
    </FormPage>
    </div>
  );
}
