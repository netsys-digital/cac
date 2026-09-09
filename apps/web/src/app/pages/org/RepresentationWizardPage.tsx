import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { useRepresentation } from '../../auth/RepresentationContext';
import { catalogApi, type Organization } from '../../api/catalogApi';
import { SelectField } from '../../components/forms/FormPage';

const steps = ['account', 'organization', 'link', 'interest', 'confirm'] as const;

export function RepresentationWizardPage() {
  const { t } = useTranslation();
  const { user, accessToken } = useAuth();
  const { refresh, isStaff } = useRepresentation();
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
    if (!accessToken || isStaff) return;
    void catalogApi.listOrganizations(accessToken).then((res) => setOrgs(res.items));
  }, [accessToken, isStaff]);

  const current = steps[step];
  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === organizationId),
    [orgs, organizationId],
  );

  const tips = useMemo(
    () => [
      { title: t('rep.tip1Title'), body: t('rep.tip1Body') },
      { title: t('rep.tip2Title'), body: t('rep.tip2Body') },
      { title: t('rep.tip3Title'), body: t('rep.tip3Body') },
    ],
    [t],
  );

  if (isStaff) {
    return <Navigate to="/" replace />;
  }

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
      await refresh();
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl rounded-[19px] border border-cac-line bg-white p-6 shadow-cac">
        <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">{t('rep.pageBadge')}</p>
        <h1 className="mt-2 text-grande font-bold text-cac-navy">{t('rep.doneTitle')}</h1>
        <p className="mt-2 text-pequena text-cac-muted">{t('rep.doneBody')}</p>
        <p className="mt-4 inline-block rounded-lg bg-amber-50 px-2 py-1 text-mini font-bold uppercase tracking-wide text-amber-800">
          {t('onboarding.pendingBadge')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">{t('rep.pageBadge')}</p>
        <h1 className="mt-2 text-grande font-bold text-cac-navy">{t('rep.pageTitle')}</h1>
        <p className="mt-2 max-w-[760px] text-pequena leading-relaxed text-cac-muted">{t('rep.pageDesc')}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <div className="overflow-hidden rounded-[19px] border border-cac-line bg-white shadow-cac">
          <div className="border-b border-cac-line bg-[#edf1f3] px-4 py-2 font-mono text-mini text-[#76838a]">
            {t('form.appbar')} · {t('rep.stepLabel', { current: step + 1, total: steps.length })}
          </div>

          <div className="p-5 md:p-6">
            <div className="mb-5 flex flex-wrap gap-1.5">
              {steps.map((s, i) => (
                <span
                  key={s}
                  className={`rounded-full px-2.5 py-1 text-mini font-bold ${
                    i === step
                      ? 'bg-cac-green3 text-cac-navy'
                      : i < step
                        ? 'bg-cac-navy text-white'
                        : 'bg-[#edf1f3] text-cac-muted'
                  }`}
                >
                  {i + 1}. {t(`rep.steps.${s}.title`)}
                </span>
              ))}
            </div>

            <h2 className="text-grande font-bold text-cac-navy">{t(`rep.steps.${current}.title`)}</h2>
            <p className="mt-1 text-pequena text-cac-muted">{t(`rep.steps.${current}.body`)}</p>

            <div className="mt-5 space-y-4">
              {current === 'account' && (
                <div className="rounded-[12px] border border-cac-line bg-[#fbfcfb] p-4 text-pequena">
                  <p className="font-bold text-cac-navy">{user?.name}</p>
                  <p className="mt-1 text-cac-muted">{user?.email}</p>
                </div>
              )}

              {current === 'organization' && (
                <>
                  <div className="flex flex-wrap gap-2">
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
                    <SelectField
                      label={t('rep.organization')}
                      value={organizationId}
                      onChange={setOrganizationId}
                    >
                      <option value="">{t('rep.selectOrg')}</option>
                      {orgs.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </SelectField>
                  ) : (
                    <Input
                      label={t('rep.newOrgName')}
                      hint={t('rep.newOrgHint')}
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                    />
                  )}
                </>
              )}

              {current === 'link' && (
                <>
                  <Input
                    label={t('rep.unit')}
                    hint={t('rep.unitHint')}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                  <Input
                    label={t('rep.linkRole')}
                    hint={t('rep.linkRoleHint')}
                    value={linkRole}
                    onChange={(e) => setLinkRole(e.target.value)}
                  />
                </>
              )}

              {current === 'interest' && (
                <TextArea
                  label={t('rep.interest')}
                  hint={t('rep.interestHint')}
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  rows={5}
                />
              )}

              {current === 'confirm' && (
                <ul className="space-y-2 rounded-[12px] border border-cac-line bg-[#fbfcfb] p-4 text-pequena text-cac-navy">
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

            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-800">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex justify-between gap-3 border-t border-cac-line pt-4">
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
        </div>

        <aside className="space-y-3">
          <div className="rounded-[16px] border border-cac-line bg-white p-4 shadow-cac">
            <p className="text-mini font-extrabold tracking-[1px] text-cac-green uppercase">
              {t('form.tipsTitle')}
            </p>
            <ul className="mt-3 space-y-3">
              {tips.map((tip) => (
                <li key={tip.title} className="rounded-[12px] border border-cac-line bg-[#fbfcfb] p-3">
                  <strong className="block text-pequena text-cac-navy">{tip.title}</strong>
                  <span className="mt-1 block text-mini leading-snug text-cac-muted">{tip.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
