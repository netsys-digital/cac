import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { useRepresentation } from '../../auth/RepresentationContext';
import { catalogApi, type Organization } from '../../api/catalogApi';
import { RegionCountryFields } from '../../components/forms/RegionCountryFields';
import { OrganizationSearchSelect } from '../../components/forms/OrganizationSearchSelect';
import { ProofDocumentField } from '../../components/forms/ProofDocumentField';
import { OrganizationLogoField } from '../../components/forms/OrganizationLogoField';

const steps = ['account', 'organization', 'link', 'interest', 'documents', 'confirm'] as const;

export function RepresentationWizardPage() {
  const { t } = useTranslation();
  const { user, accessToken, ensureAccessToken } = useAuth();
  const { refresh, isStaff } = useRepresentation();
  const [step, setStep] = useState(0);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [mode, setMode] = useState<'existing' | 'create'>('existing');
  const [organizationId, setOrganizationId] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSummary, setNewOrgSummary] = useState('');
  const [newOrgCountry, setNewOrgCountry] = useState('');
  const [newOrgRegion, setNewOrgRegion] = useState('');
  const [newOrgLogo, setNewOrgLogo] = useState<File | null>(null);
  const [unit, setUnit] = useState('');
  const [linkRole, setLinkRole] = useState('');
  const [interest, setInterest] = useState('');
  const [proofDocument1, setProofDocument1] = useState<File | null>(null);
  const [proofDocument2, setProofDocument2] = useState<File | null>(null);
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

  async function submit() {
    if (!proofDocument1) return;
    setSubmitting(true);
    setError('');
    try {
      const token = await ensureAccessToken();
      if (!token) throw new Error('unauthorized');
      const orgId = await ensureOrganizationWithToken(token);
      await catalogApi.createRepresentation(token, orgId, {
        unit,
        linkRole,
        interest,
        proofDocument1,
        proofDocument2,
      });
      await refresh();
      setDone(true);
    } catch (e) {
      const code = e instanceof Error ? e.message : 'error';
      if (code === 'proof_document_required') setError(t('rep.docRequired'));
      else if (code === 'logo_required' || code.startsWith('logo_required')) setError(t('rep.orgLogoRequired'));
      else if (code === 'slug_taken') setError(t('rep.slugTaken'));
      else if (code === 'unauthorized' || code.startsWith('unauthorized')) setError(t('rep.sessionExpired'));
      else if (code.startsWith('validation_error')) setError(t('rep.validationFailed'));
      else setError(code);
    } finally {
      setSubmitting(false);
    }
  }

  async function ensureOrganizationWithToken(token: string): Promise<string> {
    if (mode === 'existing') {
      if (!organizationId) throw new Error('org_required');
      return organizationId;
    }
    if (
      !newOrgName.trim() ||
      newOrgSummary.trim().length < 10 ||
      !newOrgCountry ||
      !newOrgRegion.trim() ||
      !newOrgLogo
    ) {
      throw new Error(t('rep.orgFieldsRequired'));
    }
    const created = await catalogApi.createOrganization(token, {
      name: newOrgName.trim(),
      summary: newOrgSummary.trim(),
      country: newOrgCountry.trim().toUpperCase(),
      region: newOrgRegion.trim(),
      logo: newOrgLogo,
    });
    setOrganizationId(created.organization.id);
    setOrgs((prev) => [...prev, created.organization]);
    return created.organization.id;
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
        <div className="mt-5">
          <Link
            to="/org/representation"
            className="inline-flex rounded-[12px] bg-cac-navy px-4 py-2.5 text-media font-extrabold text-white transition hover:bg-cac-green2"
          >
            {t('rep.backToList')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">{t('rep.pageBadge')}</p>
        <h1 className="mt-2 text-grande font-bold text-cac-navy">{t('rep.pageTitle')}</h1>
        <p className="mt-2 max-w-[760px] text-pequena leading-relaxed text-cac-muted">{t('rep.pageDesc')}</p>
        <Link
          to="/org/representation"
          className="mt-3 inline-flex text-pequena font-bold text-cac-navy underline-offset-2 hover:underline"
        >
          {t('rep.backToList')}
        </Link>
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
                    <OrganizationSearchSelect
                      label={t('rep.organization')}
                      hint={t('rep.searchOrgHint')}
                      options={orgs}
                      value={organizationId}
                      onChange={setOrganizationId}
                      required
                    />
                  ) : (
                    <div className="space-y-4">
                      <Input
                        label={t('rep.newOrgName')}
                        hint={t('rep.newOrgHint')}
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        required
                      />
                      <OrganizationLogoField file={newOrgLogo} onChange={setNewOrgLogo} required />
                      <TextArea
                        label={t('catalog.summary')}
                        hint={t('catalog.summaryHint')}
                        value={newOrgSummary}
                        onChange={(e) => setNewOrgSummary(e.target.value)}
                        rows={3}
                        required
                      />
                      <RegionCountryFields
                        region={newOrgRegion}
                        country={newOrgCountry}
                        onRegionChange={setNewOrgRegion}
                        onCountryChange={setNewOrgCountry}
                      />
                    </div>
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

              {current === 'documents' && (
                <div className="space-y-4">
                  <ProofDocumentField
                    label={t('rep.doc1')}
                    hint={t('rep.doc1Hint')}
                    required
                    file={proofDocument1}
                    onChange={setProofDocument1}
                  />
                  <ProofDocumentField
                    label={t('rep.doc2')}
                    hint={t('rep.doc2Hint')}
                    file={proofDocument2}
                    onChange={setProofDocument2}
                  />
                </div>
              )}

              {current === 'confirm' && (
                <ul className="space-y-2 rounded-[12px] border border-cac-line bg-[#fbfcfb] p-4 text-pequena text-cac-navy">
                  <li>
                    <strong>{t('rep.organization')}:</strong>{' '}
                    {mode === 'create' ? newOrgName : selectedOrg?.name}
                  </li>
                  {mode === 'create' ? (
                    <li>
                      <strong>{t('rep.orgLogo')}:</strong> {newOrgLogo?.name ?? '—'}
                    </li>
                  ) : null}
                  <li>
                    <strong>{t('rep.unit')}:</strong> {unit}
                  </li>
                  <li>
                    <strong>{t('rep.linkRole')}:</strong> {linkRole}
                  </li>
                  <li>
                    <strong>{t('rep.interest')}:</strong> {interest}
                  </li>
                  <li>
                    <strong>{t('rep.doc1')}:</strong> {proofDocument1?.name ?? '—'}
                  </li>
                  <li>
                    <strong>{t('rep.doc2')}:</strong> {proofDocument2?.name ?? t('rep.docOptionalEmpty')}
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
                    (current === 'organization' &&
                      mode === 'create' &&
                      (newOrgName.trim().length < 2 ||
                        newOrgSummary.trim().length < 10 ||
                        !newOrgCountry ||
                        !newOrgRegion.trim() ||
                        !newOrgLogo)) ||
                    (current === 'link' && (unit.trim().length < 2 || linkRole.trim().length < 2)) ||
                    (current === 'interest' && interest.trim().length < 10) ||
                    (current === 'documents' && !proofDocument1)
                  }
                >
                  {t('rep.next')}
                </Button>
              ) : (
                <Button onClick={() => void submit()} disabled={submitting || !proofDocument1}>
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
