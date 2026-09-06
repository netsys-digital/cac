import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type Organization } from '../../api/catalogApi';

const steps = ['account', 'organization', 'link', 'interest', 'confirm'] as const;

export function RepresentationWizardPage() {
  const { t } = useTranslation();
  const { user, accessToken } = useAuth();
  const [step, setStep] = useState(0);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [mode, setMode] = useState<'existing' | 'create'>('existing');
  const [organizationId, setOrganizationId] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [unit, setUnit] = useState('');
  const [linkRole, setLinkRole] = useState('');
  const [interest, setInterest] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    void catalogApi.listOrganizations(accessToken).then((res) => setOrgs(res.items));
  }, [accessToken]);

  const current = steps[step];
  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === organizationId),
    [orgs, organizationId],
  );

  async function ensureOrganization(): Promise<string> {
    if (!accessToken) throw new Error('unauthorized');
    if (mode === 'existing') {
      if (!organizationId) throw new Error('org_required');
      return organizationId;
    }
    const created = await catalogApi.createOrganization(accessToken, {
      name: newOrgName,
      country: 'BR',
    });
    setOrganizationId(created.organization.id);
    setOrgs((prev) => [...prev, created.organization]);
    return created.organization.id;
  }

  async function submit() {
    if (!accessToken) return;
    setSubmitting(true);
    setError('');
    try {
      const orgId = await ensureOrganization();
      await catalogApi.createRepresentation(accessToken, orgId, { unit, linkRole, interest });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-cac-line bg-white/80 p-6">
        <h1 className="font-display text-2xl text-cac-ink">{t('rep.doneTitle')}</h1>
        <p className="mt-2 text-cac-muted">{t('rep.doneBody')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cac-line bg-white/80 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-cac-accent">
        {t('rep.stepLabel', { current: step + 1, total: steps.length })}
      </p>
      <h1 className="mt-2 font-display text-2xl text-cac-ink">{t(`rep.steps.${current}.title`)}</h1>
      <p className="mt-1 text-sm text-cac-muted">{t(`rep.steps.${current}.body`)}</p>

      <div className="mt-6 space-y-4">
        {current === 'account' && (
          <div className="rounded-md bg-cac-mist/60 p-4 text-sm">
            <p className="font-semibold text-cac-ink">{user?.name}</p>
            <p className="text-cac-muted">{user?.email}</p>
          </div>
        )}

        {current === 'organization' && (
          <>
            <div className="flex gap-2">
              <Button
                variant={mode === 'existing' ? 'primary' : 'secondary'}
                onClick={() => setMode('existing')}
              >
                {t('rep.chooseExisting')}
              </Button>
              <Button
                variant={mode === 'create' ? 'primary' : 'secondary'}
                onClick={() => setMode('create')}
              >
                {t('rep.createNew')}
              </Button>
            </div>
            {mode === 'existing' ? (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">{t('rep.organization')}</span>
                <select
                  className="rounded-md border border-cac-line bg-white px-3 py-2"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                >
                  <option value="">{t('rep.selectOrg')}</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <Input
                label={t('rep.newOrgName')}
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
              />
            )}
          </>
        )}

        {current === 'link' && (
          <>
            <Input label={t('rep.unit')} value={unit} onChange={(e) => setUnit(e.target.value)} />
            <Input
              label={t('rep.linkRole')}
              value={linkRole}
              onChange={(e) => setLinkRole(e.target.value)}
            />
          </>
        )}

        {current === 'interest' && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">{t('rep.interest')}</span>
            <textarea
              className="min-h-28 rounded-md border border-cac-line bg-white px-3 py-2"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
            />
          </label>
        )}

        {current === 'confirm' && (
          <ul className="space-y-2 text-sm text-cac-ink">
            <li>
              <strong>{t('rep.organization')}:</strong>{' '}
              {mode === 'create' ? newOrgName : selectedOrg?.name}
            </li>
            <li>
              <strong>{t('rep.unit')}:</strong> {unit}
            </li>
            <li>
              <strong>{t('rep.linkRole')}:</strong> {linkRole}
            </li>
            <li>
              <strong>{t('rep.interest')}:</strong> {interest}
            </li>
          </ul>
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 flex justify-between gap-3">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          {t('rep.back')}
        </Button>
        {step < steps.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={
              (current === 'organization' && mode === 'existing' && !organizationId) ||
              (current === 'organization' && mode === 'create' && newOrgName.trim().length < 2) ||
              (current === 'link' && (unit.trim().length < 2 || linkRole.trim().length < 2)) ||
              (current === 'interest' && interest.trim().length < 10)
            }
          >
            {t('rep.next')}
          </Button>
        ) : (
          <Button onClick={() => void submit()} disabled={submitting}>
            {t('rep.submit')}
          </Button>
        )}
      </div>
    </div>
  );
}
