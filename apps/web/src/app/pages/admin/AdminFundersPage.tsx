import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, useDialog } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import {
  catalogApi,
  type AdminFunder,
  type AdminOrganization,
  type FunderStatus,
  type FunderWriteBody,
} from '../../api/catalogApi';
import { Modal } from '../../components/Modal';
import { useModalState } from '../../components/useModalState';
import { RegionCountryFields } from '../../components/forms/RegionCountryFields';
import { resolveMediaUrl } from '../../components/forms/RepresentativeImageField';
import { SelectField } from '../../components/forms/FormPage';

type FunderDraft = {
  name: string;
  summary: string;
  website: string;
  interestAreas: string;
  contactName: string;
  contactEmail: string;
  country: string;
  region: string;
  organizationId: string;
  status: FunderStatus;
};

const emptyDraft = (): FunderDraft => ({
  name: '',
  summary: '',
  website: '',
  interestAreas: '',
  contactName: '',
  contactEmail: '',
  country: '',
  region: '',
  organizationId: '',
  status: 'PUBLISHED',
});

function toDraft(item: AdminFunder): FunderDraft {
  return {
    name: item.name,
    summary: item.summary,
    website: item.website ?? '',
    interestAreas: item.interestAreas ?? '',
    contactName: item.contactName ?? '',
    contactEmail: item.contactEmail ?? '',
    country: item.country ?? '',
    region: item.region ?? '',
    organizationId: item.organizationId ?? '',
    status: item.status,
  };
}

export function AdminFundersPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const dialog = useDialog();
  const modal = useModalState<AdminFunder>();
  const [items, setItems] = useState<AdminFunder[]>([]);
  const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
  const [draft, setDraft] = useState<FunderDraft>(emptyDraft);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    const [funders, organizations] = await Promise.all([
      catalogApi.adminFunders(accessToken),
      catalogApi.adminOrganizations(accessToken),
    ]);
    setItems(funders.items);
    setOrgs(organizations.items);
  }, [accessToken]);

  useEffect(() => {
    void load().catch(() => setError(t('admin.fundersError')));
  }, [load, t]);

  useEffect(() => {
    if (!modal.open) {
      setDraft(emptyDraft());
      setLogoFile(null);
      setError('');
      return;
    }
    setLogoFile(null);
    setDraft(modal.mode === 'create' || !modal.item ? emptyDraft() : toDraft(modal.item));
  }, [modal.open, modal.mode, modal.item]);

  function saveError(err: unknown) {
    const text = err instanceof Error ? err.message : '';
    if (text.includes('slug_taken')) return t('admin.fundersSlugTaken');
    return text || t('admin.fundersError');
  }

  async function onSave() {
    if (!accessToken) return;
    if (
      draft.name.trim().length < 2 ||
      draft.summary.trim().length < 10 ||
      draft.interestAreas.trim().length < 10 ||
      draft.contactName.trim().length < 2 ||
      !draft.contactEmail.includes('@') ||
      !/^https?:\/\/.+/i.test(draft.website.trim()) ||
      draft.country.length !== 2 ||
      draft.region.trim().length < 2 ||
      ((modal.mode === 'create' || !modal.item?.logoUrl) && !logoFile)
    ) {
      setError(t('admin.fundersFormRequired'));
      return;
    }
    const body: FunderWriteBody = {
      name: draft.name.trim(),
      summary: draft.summary.trim(),
      website: draft.website.trim(),
      interestAreas: draft.interestAreas.trim(),
      contactName: draft.contactName.trim(),
      contactEmail: draft.contactEmail.trim(),
      country: draft.country,
      region: draft.region,
      organizationId: draft.organizationId || null,
      status: draft.status,
    };
    setBusy(true);
    setError('');
    try {
      const saved =
        modal.mode === 'create'
          ? await catalogApi.createFunder(accessToken, body)
          : modal.item
            ? await catalogApi.updateFunder(accessToken, modal.item.id, body)
            : null;
      if (saved && logoFile) await catalogApi.uploadFunderLogo(accessToken, saved.funder.id, logoFile);
      setMessage(modal.mode === 'create' ? t('admin.fundersCreated') : t('admin.fundersUpdated'));
      modal.close();
      await load();
    } catch (err) {
      setError(saveError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(item: AdminFunder) {
    if (!accessToken) return;
    const ok = await dialog.confirm({
      title: t('admin.fundersDeleteTitle'),
      message: t('admin.fundersDeleteConfirm', { name: item.name }),
      confirmLabel: t('common.delete'),
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    setError('');
    try {
      await catalogApi.deleteFunder(accessToken, item.id);
      setMessage(t('admin.fundersDeleted'));
      if (modal.item?.id === item.id) modal.close();
      await load();
    } catch (err) {
      setError(saveError(err));
    } finally {
      setBusy(false);
    }
  }

  const isView = modal.mode === 'view';

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
        <div>
          <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
            {t('admin.fundersEyebrow')}
          </p>
          <h1 className="mt-1 text-grande font-bold text-cac-navy">{t('admin.fundersTitle')}</h1>
          <p className="mt-2 max-w-2xl text-pequena leading-relaxed text-cac-muted">{t('admin.fundersHint')}</p>
        </div>
        <Button type="button" onClick={() => modal.openCreate()}>
          {t('common.add')}
        </Button>
      </header>

      {message ? (
        <p className="rounded-xl border border-cac-line bg-cac-green3/40 px-4 py-3 text-media font-semibold text-cac-navy">
          {message}
        </p>
      ) : null}
      {error && !modal.open ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-media font-semibold text-red-800">
          {error}
        </p>
      ) : null}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cac-line bg-white px-4 py-3 shadow-cac"
          >
            <div className="min-w-0">
              <p className="text-media font-bold text-cac-navy">{item.name}</p>
              <p className="mt-1 line-clamp-2 text-pequena text-cac-muted">{item.summary}</p>
              <p className="mt-1 text-mini text-cac-muted">
                {t(`mine.status.${item.status}`)}
                {item.country ? ` · ${item.country}` : ''}
                {item.region ? ` · ${item.region}` : ''}
                {item.organization?.name ? ` · ${item.organization.name}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => modal.openView(item)}>
                {t('common.view')}
              </Button>
              <Button type="button" onClick={() => modal.openEdit(item)}>
                {t('common.edit')}
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => void onDelete(item)}>
                {t('common.delete')}
              </Button>
            </div>
          </li>
        ))}
        {!items.length ? (
          <li className="rounded-2xl border border-dashed border-cac-line bg-white px-4 py-8 text-center text-media text-cac-muted">
            {t('admin.fundersEmpty')}
          </li>
        ) : null}
      </ul>

      <Modal
        open={modal.open}
        onClose={modal.close}
        mode={modal.mode}
        badge={t('admin.fundersEyebrow')}
        title={
          modal.mode === 'create'
            ? t('admin.fundersCreate')
            : modal.item
              ? modal.item.name
              : t('admin.fundersTitle')
        }
        size="lg"
        dismissible={!busy}
        footer={
          isView ? (
            <>
              <Button type="button" variant="secondary" onClick={modal.close}>
                {t('common.close')}
              </Button>
              <Button type="button" onClick={() => modal.setMode('edit')}>
                {t('common.edit')}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" disabled={busy} onClick={modal.close}>
                {t('common.cancel')}
              </Button>
              <Button type="button" disabled={busy} onClick={() => void onSave()}>
                {busy ? t('common.working') : modal.mode === 'create' ? t('common.create') : t('common.save')}
              </Button>
            </>
          )
        }
      >
        {error && modal.open ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-800">
            {error}
          </p>
        ) : null}

        {isView && modal.item ? (
          <dl className="space-y-3 rounded-xl border border-cac-line bg-white p-4 text-media">
            <div>
              <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">{t('admin.fundersName')}</dt>
              <dd className="font-bold text-cac-navy">{modal.item.name}</dd>
            </div>
            {resolveMediaUrl(modal.item.logoUrl) ? (
              <div>
                <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">{t('admin.fundersLogo')}</dt>
                <dd className="mt-2">
                  <img src={resolveMediaUrl(modal.item.logoUrl)!} alt="" className="h-16 w-16 rounded-xl object-contain" />
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">{t('admin.fundersSummary')}</dt>
              <dd className="text-cac-navy">{modal.item.summary}</dd>
            </div>
            <div>
              <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">{t('admin.fundersInterest')}</dt>
              <dd className="text-cac-navy">{modal.item.interestAreas || '—'}</dd>
            </div>
            <div>
              <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">{t('admin.fundersWebsite')}</dt>
              <dd className="text-cac-navy">{modal.item.website || '—'}</dd>
            </div>
            <div>
              <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">{t('admin.fundersContactName')}</dt>
              <dd className="text-cac-navy">{modal.item.contactName || '—'}</dd>
            </div>
            <div>
              <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">{t('admin.fundersContactEmail')}</dt>
              <dd className="text-cac-navy">{modal.item.contactEmail || '—'}</dd>
            </div>
            <div>
              <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">{t('admin.fundersStatus')}</dt>
              <dd className="text-cac-navy">{t(`mine.status.${modal.item.status}`)}</dd>
            </div>
            <div>
              <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">{t('admin.fundersOrg')}</dt>
              <dd className="text-cac-navy">{modal.item.organization?.name || t('admin.fundersOrgNone')}</dd>
            </div>
          </dl>
        ) : (
          <div className="space-y-3 rounded-xl border border-cac-line bg-white p-4">
            <Input
              label={t('admin.fundersName')}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              required
              disabled={busy}
            />
            <label className="flex w-full flex-col gap-1">
              <span className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                {t('admin.fundersLogo')}
              </span>
              <span className="text-mini leading-snug text-cac-muted">{t('admin.fundersLogoHint')}</span>
              {resolveMediaUrl(modal.item?.logoUrl) && !logoFile ? (
                <img src={resolveMediaUrl(modal.item?.logoUrl)!} alt="" className="h-16 w-16 rounded-xl object-contain" />
              ) : null}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className="text-pequena text-cac-navy"
              />
            </label>
            <Input
              label={t('admin.fundersWebsite')}
              hint={t('admin.fundersWebsiteHint')}
              value={draft.website}
              onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))}
              required
              disabled={busy}
              placeholder="https://"
            />
            <label className="flex w-full flex-col gap-1">
              <span className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                {t('admin.fundersSummary')}
              </span>
              <span className="text-mini leading-snug text-cac-muted">{t('admin.fundersSummaryHint')}</span>
              <textarea
                value={draft.summary}
                onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
                required
                disabled={busy}
                rows={4}
                className="rounded-xl border border-cac-line bg-white px-3.5 py-2.5 text-media text-cac-navy"
              />
            </label>
            <label className="flex w-full flex-col gap-1">
              <span className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                {t('admin.fundersInterest')}
              </span>
              <span className="text-mini leading-snug text-cac-muted">{t('admin.fundersInterestHint')}</span>
              <textarea
                value={draft.interestAreas}
                onChange={(e) => setDraft((d) => ({ ...d, interestAreas: e.target.value }))}
                required
                disabled={busy}
                rows={4}
                className="rounded-xl border border-cac-line bg-white px-3.5 py-2.5 text-media text-cac-navy"
              />
            </label>
            <Input
              label={t('admin.fundersContactName')}
              value={draft.contactName}
              onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))}
              required
              disabled={busy}
            />
            <Input
              label={t('admin.fundersContactEmail')}
              type="email"
              value={draft.contactEmail}
              onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))}
              required
              disabled={busy}
            />
            <RegionCountryFields
              region={draft.region}
              country={draft.country}
              onRegionChange={(region) => setDraft((d) => ({ ...d, region }))}
              onCountryChange={(country) => setDraft((d) => ({ ...d, country }))}
              regionLabel={t('admin.fundersRegion')}
              countryLabel={t('admin.fundersCountry')}
            />
            <SelectField
              label={t('admin.fundersOrg')}
              hint={t('admin.fundersOrgHint')}
              value={draft.organizationId}
              onChange={(organizationId) => setDraft((d) => ({ ...d, organizationId }))}
              disabled={busy}
            >
              <option value="">{t('admin.fundersOrgNone')}</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label={t('admin.fundersStatus')}
              hint={t('admin.fundersStatusHint')}
              value={draft.status}
              onChange={(status) => setDraft((d) => ({ ...d, status: status as FunderStatus }))}
              required
              disabled={busy}
            >
              <option value="PUBLISHED">{t('mine.status.PUBLISHED')}</option>
              <option value="DRAFT">{t('mine.status.DRAFT')}</option>
              <option value="ARCHIVED">{t('mine.status.ARCHIVED')}</option>
            </SelectField>
          </div>
        )}
      </Modal>
    </div>
  );
}
