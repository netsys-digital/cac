import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TextArea } from '@cac/ui';
import { ConnectionObjective } from '@cac/shared';
import { useAuth } from '../../auth/AuthContext';
import { myContentsApi } from '../../api/myContentsApi';
import { connectionsApi } from '../../api/connectionsApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';

type MyOrg = { id: string; name: string };

function mapConnError(code: string, t: (key: string) => string) {
  if (code === 'forbidden_org') return t('conn.forbiddenOrg');
  if (code === 'same_org') return t('conn.sameOrg');
  if (code === 'not_found') return t('conn.targetNotFound');
  return code || t('conn.error');
}

export function NewConnectionPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = Boolean((location.state as { justRegistered?: boolean } | null)?.justRegistered);
  const targetType = params.get('targetType') ?? 'TECHNOLOGY';
  const targetId = params.get('targetId') ?? '';
  const [orgs, setOrgs] = useState<MyOrg[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
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

  const saveOnly = params.get('intent') === 'save' && Boolean(targetId);

  useEffect(() => {
    if (!saveOnly) return;
    const qs = new URLSearchParams({
      intent: 'save',
      targetType,
      targetId,
    });
    navigate(`/my/favorites?${qs.toString()}`, { replace: true });
  }, [navigate, saveOnly, targetId, targetType]);

  useEffect(() => {
    if (saveOnly) return;
    if (!accessToken) {
      setOrgs([]);
      setRequesterOrgId('');
      setLoadingOrgs(false);
      return;
    }
    setLoadingOrgs(true);
    void myContentsApi
      .listMyOrganizations(accessToken)
      .then((res) => {
        setOrgs(res.items);
        if (res.items.length === 1) setRequesterOrgId(res.items[0]!.id);
        else if (res.items.length > 1) setRequesterOrgId((prev) => prev || res.items[0]!.id);
        else setRequesterOrgId('');
      })
      .catch(() => {
        setOrgs([]);
        setRequesterOrgId('');
      })
      .finally(() => setLoadingOrgs(false));
  }, [accessToken, saveOnly]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !targetId || !requesterOrgId) {
      setError(orgs.length === 0 ? t('conn.needOrg') : t('conn.missing'));
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
      setError(mapConnError(e instanceof Error ? e.message : '', t));
    }
  }

  if (saveOnly || loadingOrgs) {
    return (
      <div className="rounded-2xl border border-cac-line bg-white p-5 text-media text-cac-muted shadow-cac">
        {t('dash.loading')}
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div className="space-y-4">
        {justRegistered ? (
          <p className="rounded-[12px] border border-cac-green/30 bg-cac-green3 px-4 py-3 text-pequena font-medium text-cac-navy">
            {t('auth.justRegisteredConnect')}
          </p>
        ) : null}
        <div className="rounded-2xl border border-cac-line bg-white p-6 shadow-cac">
          <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">conexão</p>
          <h1 className="mt-2 text-grande font-bold text-cac-navy">{t('conn.newTitle')}</h1>
          <p className="mt-2 max-w-2xl text-media text-cac-muted">{t('conn.needOrgBody')}</p>
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-pequena font-medium text-amber-900">
            {t('conn.needOrg')}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/org/representation"
              className="inline-flex rounded-[12px] bg-cac-navy px-4 py-2.5 text-media font-extrabold text-white transition hover:bg-cac-green2"
            >
              {t('conn.goRepresentation')}
            </Link>
            <Link
              to="/"
              className="inline-flex rounded-[12px] border border-cac-line bg-white px-4 py-2.5 text-media font-extrabold text-cac-navy transition hover:bg-cac-bg"
            >
              {t('nav.dashboard')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const singleOrg = orgs.length === 1 ? orgs[0] : null;

  return (
    <div className="space-y-4">
      {justRegistered ? (
        <p className="rounded-[12px] border border-cac-green/30 bg-cac-green3 px-4 py-3 text-pequena font-medium text-cac-navy">
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
          <p className="rounded-lg border border-cac-line bg-[#fbfcfb] px-3 py-2 text-pequena text-cac-muted">
            {t('conn.targetMeta', { type: targetType, id: targetId || '—' })}
          </p>
        </FieldFull>
        <FieldFull>
          {singleOrg ? (
            <div className="flex flex-col gap-1">
              <span className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                {t('conn.requesterOrg')}
              </span>
              <span className="text-mini leading-snug text-cac-muted">{t('conn.requesterOrgSingleHint')}</span>
              <p className="rounded-lg border border-cac-line bg-[#fbfcfb] px-3 py-2 text-pequena font-bold text-cac-navy">
                {singleOrg.name}
              </p>
            </div>
          ) : (
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
          )}
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
