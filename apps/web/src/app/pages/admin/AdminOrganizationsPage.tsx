import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ORG_BANNER_FIELD,
  ORG_BANNER_LINK_FIELD,
  ORG_PUBLISH_KINDS,
  type OrgPublishKind,
} from '@cac/shared';
import { Button, useDialog } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type AdminOrganization, type OrganizationLink } from '../../api/catalogApi';
import { Modal } from '../../components/Modal';
import { useModalState } from '../../components/useModalState';
import { BannerImageField } from '../../components/forms/BannerImageField';
import { OrganizationLogoField } from '../../components/forms/OrganizationLogoField';
import { PublishKindsPicker } from '../../components/forms/PublishKindsPicker';
import { RegionCountryFields } from '../../components/forms/RegionCountryFields';
import { resolveMediaUrl } from '../../components/forms/RepresentativeImageField';

type StatusFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';
type KindFilter = 'ALL' | OrgPublishKind;
type OrgModalTab = 'profile' | 'media' | 'links';

type ProfileDraft = {
  name: string;
  summary: string;
  website: string;
  region: string;
  country: string;
  logoFile: File | null;
  bannerFiles: Partial<Record<OrgPublishKind, File | null>>;
  bannerLinks: Partial<Record<OrgPublishKind, string>>;
  publishKinds: OrgPublishKind[];
};

function profileFromOrg(org: AdminOrganization): ProfileDraft {
  return {
    name: org.name ?? '',
    summary: org.summary ?? '',
    website: org.website ?? '',
    region: org.region ?? '',
    country: org.country ?? '',
    logoFile: null,
    bannerFiles: {},
    bannerLinks: Object.fromEntries(
      ORG_PUBLISH_KINDS.map((kind) => [kind, org[ORG_BANNER_LINK_FIELD[kind]] ?? '']),
    ) as Partial<Record<OrgPublishKind, string>>,
    publishKinds: [...(org.publishKinds ?? [])],
  };
}

function orgBannerCurrentUrl(org: AdminOrganization, kind: OrgPublishKind): string | null {
  return org[ORG_BANNER_FIELD[kind]] ?? null;
}

function statusClass(status: string) {
  if (status === 'VERIFIED') return 'bg-cac-green3 text-cac-green';
  if (status === 'REJECTED') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-900';
}

function linkStatusClass(status: string) {
  if (status === 'APPROVED') return 'bg-cac-green3 text-cac-navy';
  if (status === 'REJECTED') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-900';
}

function linksFromOrganization(org: AdminOrganization): OrganizationLink[] {
  const reps = org.representationRequests ?? [];
  const members = org.members ?? [];
  const covered = new Set(reps.map((r) => r.userId));
  return [
    ...reps.map((r) => ({
      id: r.id,
      source: 'REPRESENTATION' as const,
      representationId: r.id,
      memberId: members.find((m) => m.userId === r.userId)?.id ?? null,
      status: r.status,
      unit: r.unit,
      linkRole: r.linkRole,
      interest: r.interest,
      user: r.user,
    })),
    ...members
      .filter((m) => !covered.has(m.userId))
      .map((m) => ({
        id: m.id,
        source: 'MEMBER' as const,
        representationId: null,
        memberId: m.id,
        status: 'APPROVED',
        unit: null,
        linkRole: m.role,
        interest: null,
        user: m.user,
      })),
  ];
}

export function AdminOrganizationsPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const dialog = useDialog();
  const modal = useModalState<AdminOrganization>();
  const [items, setItems] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [modalTab, setModalTab] = useState<OrgModalTab>('profile');
  const [links, setLinks] = useState<OrganizationLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [region, setRegion] = useState('ALL');
  const [country, setCountry] = useState('ALL');
  const [kind, setKind] = useState<KindFilter>('ALL');

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await catalogApi.adminOrganizations(accessToken);
      setItems(res.items ?? []);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : t('admin.orgsError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  const loadLinks = useCallback(
    async (org: AdminOrganization) => {
      // Preferência: dados já vindos da listagem admin (membros + representações).
      const embedded = linksFromOrganization(org);
      if (embedded.length) {
        setLinks(embedded);
        return;
      }
      if (!accessToken) {
        setLinks([]);
        return;
      }
      setLinksLoading(true);
      setError('');
      try {
        const res = await catalogApi.organizationRepresentations(accessToken, org.id);
        setLinks(res.items ?? []);
      } catch (e) {
        setLinks([]);
        setError(e instanceof Error ? e.message : t('admin.orgsLinksLoadError'));
      } finally {
        setLinksLoading(false);
      }
    },
    [accessToken, t],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (modal.open && modal.item && modal.mode !== 'create') {
      setDraft(profileFromOrg(modal.item));
    } else if (!modal.open) {
      setDraft(null);
      setLinks([]);
      setModalTab('profile');
      setDeletingLinkId(null);
    }
  }, [modal.open, modal.item, modal.mode]);

  useEffect(() => {
    if (!modal.open || !modal.item || modal.mode === 'create') return;
    const fresh = items.find((o) => o.id === modal.item!.id) ?? modal.item;
    void loadLinks(fresh);
  }, [modal.open, modal.item, modal.mode, items, loadLinks]);

  const regions = useMemo(
    () =>
      [...new Set(items.map((o) => o.region).filter((v): v is string => Boolean(v)))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [items],
  );

  const countries = useMemo(() => {
    const pool = region === 'ALL' ? items : items.filter((o) => (o.region ?? '') === region);
    return [
      ...new Set(pool.map((o) => o.country).filter((v): v is string => Boolean(v))),
    ].sort((a, b) => a.localeCompare(b));
  }, [items, region]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((o) => {
      if (status !== 'ALL' && o.verificationStatus !== status) return false;
      if (region !== 'ALL' && (o.region ?? '') !== region) return false;
      if (country !== 'ALL' && (o.country ?? '') !== country) return false;
      if (kind !== 'ALL' && !(o.publishKinds ?? []).includes(kind)) return false;
      if (!needle) return true;
      const hay = `${o.name} ${o.slug} ${o.country ?? ''} ${o.region ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q, status, region, country, kind]);

  const statusCounts = useMemo(() => {
    const base = { PENDING: 0, VERIFIED: 0, REJECTED: 0 };
    for (const o of items) {
      if (o.verificationStatus in base) {
        base[o.verificationStatus as keyof typeof base] += 1;
      }
    }
    return base;
  }, [items]);

  const hasActiveFilters =
    q.trim().length > 0 || status !== 'ALL' || region !== 'ALL' || country !== 'ALL' || kind !== 'ALL';

  const authorizedLinks = useMemo(
    () => links.filter((l) => l.status === 'APPROVED'),
    [links],
  );
  const requestedLinks = useMemo(
    () => links.filter((l) => l.status === 'REQUESTED' || l.status === 'UNDER_REVIEW'),
    [links],
  );

  function patchDraft(patch: Partial<ProfileDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function saveAll() {
    if (!accessToken || !modal.item || !draft) return;
    if (!draft.name.trim() || draft.name.trim().length < 2) {
      setError(t('admin.orgsProfileNameRequired'));
      return;
    }
    if (!draft.region || !draft.country) {
      setError(t('admin.orgsProfileRegionRequired'));
      return;
    }
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await catalogApi.updateOrganization(accessToken, modal.item.id, {
        name: draft.name.trim(),
        summary: draft.summary.trim() || null,
        website: draft.website.trim() || null,
        region: draft.region,
        country: draft.country,
        publishKinds: draft.publishKinds,
        technologyBannerLinkUrl: (draft.bannerLinks.TECHNOLOGY ?? '').trim() || null,
        challengeBannerLinkUrl: (draft.bannerLinks.CHALLENGE ?? '').trim() || null,
        fundingOfferBannerLinkUrl: (draft.bannerLinks.FUNDING_OFFER ?? '').trim() || null,
        successCaseBannerLinkUrl: (draft.bannerLinks.SUCCESS_CASE ?? '').trim() || null,
      });
      if (draft.logoFile) {
        await catalogApi.uploadOrganizationLogo(accessToken, modal.item.id, draft.logoFile);
      }
      for (const kind of ORG_PUBLISH_KINDS) {
        const file = draft.bannerFiles[kind];
        if (file) {
          await catalogApi.uploadOrganizationBanner(accessToken, modal.item.id, kind, file);
        }
      }
      setMessage(t('admin.orgsProfileSaved', { name: draft.name.trim() }));
      modal.close();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.orgsError'));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!accessToken || !modal.item) return;
    setBusy(true);
    setError('');
    try {
      await catalogApi.verifyOrganization(accessToken, modal.item.id);
      setMessage(t('admin.orgsVerified', { name: modal.item.name }));
      modal.close();
      await load();
    } catch {
      setError(t('admin.orgsError'));
    } finally {
      setBusy(false);
    }
  }

  async function deleteLink(link: OrganizationLink) {
    if (!accessToken || !modal.item) return;
    const name = link.user?.name ?? link.user?.email ?? '—';
    const ok = await dialog.confirm({
      title: t('admin.orgsLinkDelete'),
      message: t('admin.orgsLinkDeleteConfirm', { name }),
      confirmLabel: t('admin.orgsLinkDelete'),
      tone: 'danger',
    });
    if (!ok) return;
    setDeletingLinkId(link.id);
    setError('');
    try {
      if (link.source === 'REPRESENTATION' && link.representationId) {
        await catalogApi.deleteRepresentation(accessToken, link.representationId);
      } else if (link.memberId) {
        await catalogApi.deleteOrganizationMember(accessToken, modal.item.id, link.memberId);
      } else {
        throw new Error('invalid_link');
      }
      setMessage(t('admin.orgsLinkDeleted'));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.orgsError'));
    } finally {
      setDeletingLinkId(null);
    }
  }

  function linkStatusLabel(status: string) {
    const key = `admin.orgsLinkStatus.${status}`;
    const label = t(key);
    return label === key ? status : label;
  }

  function renderLinkGroup(title: string, group: OrganizationLink[]) {
    if (!group.length) return null;
    return (
      <div className="space-y-2">
        <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
          {title} ({group.length})
        </p>
        <ul className="space-y-2">
          {group.map((link) => (
            <li
              key={`${link.source}-${link.id}`}
              className="flex flex-col gap-2 rounded-[12px] border border-cac-line bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-media font-bold text-cac-navy">
                  {link.user?.name ?? '—'}
                </p>
                <p className="truncate text-pequena text-cac-muted">{link.user?.email ?? '—'}</p>
                <p className="mt-1 text-mini text-cac-muted">
                  {[link.linkRole, link.unit].filter(Boolean).join(' · ') ||
                    (link.source === 'MEMBER' ? t('admin.orgsLinkMemberOnly') : '—')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-mini font-bold uppercase tracking-wide ${linkStatusClass(link.status)}`}
                >
                  {linkStatusLabel(link.status)}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy || deletingLinkId === link.id}
                  onClick={() => void deleteLink(link)}
                >
                  {deletingLinkId === link.id ? t('common.working') : t('admin.orgsLinkDelete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const org = modal.item;
  const isView = modal.mode === 'view';

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
        <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
          {t('admin.orgsEyebrow')}
        </p>
        <h1 className="mt-1 text-grande font-bold text-cac-navy">{t('admin.orgsTitle')}</h1>
        <p className="mt-2 max-w-3xl text-media text-cac-muted">{t('admin.orgsSupport')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['ALL', items.length],
              ['PENDING', statusCounts.PENDING],
              ['VERIFIED', statusCounts.VERIFIED],
              ['REJECTED', statusCounts.REJECTED],
            ] as const
          ).map(([key, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`rounded-full border px-3 py-1.5 text-pequena font-bold transition ${
                status === key
                  ? 'border-cac-navy bg-cac-navy text-white'
                  : 'border-cac-line bg-[#fbfcfb] text-cac-navy hover:bg-cac-green3'
              }`}
            >
              {key === 'ALL' ? t('admin.orgsFilterAllStatus') : t(`admin.orgStatus.${key}`)} {count}
            </button>
          ))}
        </div>
      </header>

      <section className="space-y-3 rounded-[18px] border border-cac-line bg-white p-4 shadow-cac md:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('admin.orgsFilterSearch')}
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin.orgsFilterSearchPlaceholder')}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            />
          </label>
          <label className="min-w-[140px]">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('admin.orgsFilterRegion')}
            </span>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setCountry('ALL');
              }}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            >
              <option value="ALL">{t('admin.orgsFilterAllRegions')}</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[140px]">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('admin.orgsFilterCountry')}
            </span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            >
              <option value="ALL">{t('admin.orgsFilterAllCountries')}</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[160px]">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('admin.orgsFilterKind')}
            </span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as KindFilter)}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            >
              <option value="ALL">{t('admin.orgsFilterAllKinds')}</option>
              {ORG_PUBLISH_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`admin.publishKind.${k}`)}
                </option>
              ))}
            </select>
          </label>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setQ('');
                setStatus('ALL');
                setRegion('ALL');
                setCountry('ALL');
                setKind('ALL');
              }}
            >
              {t('admin.orgsFilterClear')}
            </Button>
          ) : null}
        </div>
        <p className="text-pequena text-cac-muted">
          {t('admin.orgsFilteredTotal', { count: filtered.length, total: items.length })}
        </p>
      </section>

      {message ? (
        <p className="rounded-xl border border-cac-line bg-cac-green3/40 px-4 py-3 text-media font-semibold text-cac-navy">
          {message}
        </p>
      ) : null}
      {error && !modal.open ? (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-media font-semibold text-red-800">{error}</p>
          <Button type="button" variant="secondary" onClick={() => void load()}>
            {t('admin.orgsRetry')}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-media text-cac-muted">{t('dash.loading')}</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => {
            const logo = resolveMediaUrl(item.logoUrl);
            return (
              <li key={item.id} className="rounded-2xl border border-cac-line bg-white p-4 shadow-cac">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    {logo ? (
                      <img
                        src={logo}
                        alt=""
                        className="size-12 shrink-0 rounded-xl border border-cac-line object-cover"
                      />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[linear-gradient(145deg,#0a2440,#1a4d4a)] text-pequena font-bold text-[#90d6b6]">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-media font-bold text-cac-navy">{item.name}</p>
                      <p className="text-pequena text-cac-muted">
                        {item.slug}
                        {item.country ? ` · ${item.country}` : ''}
                        {item.region ? ` · ${item.region}` : ''}
                      </p>
                      <p className="mt-1 text-mini text-cac-muted">
                        {t('admin.orgsCounts', {
                          members: item._count?.members ?? 0,
                          tech: item._count?.technologies ?? 0,
                          challenges: item._count?.challenges ?? 0,
                          offers: item._count?.fundingOffers ?? 0,
                          cases: item._count?.successCases ?? 0,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-mini font-bold uppercase tracking-wide ${statusClass(item.verificationStatus)}`}
                    >
                      {t(`admin.orgStatus.${item.verificationStatus}`)}
                    </span>
                    <Button type="button" variant="secondary" onClick={() => modal.openView(item)}>
                      {t('common.view')}
                    </Button>
                    <Button type="button" onClick={() => modal.openEdit(item)}>
                      {t('common.edit')}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
          {!filtered.length ? (
            <li className="rounded-2xl border border-dashed border-cac-line bg-white px-4 py-8 text-center text-media text-cac-muted">
              {items.length ? t('admin.orgsFilterEmpty') : t('admin.orgsEmpty')}
            </li>
          ) : null}
        </ul>
      )}

      <Modal
        open={modal.open}
        onClose={modal.close}
        mode={modal.mode}
        badge={t('admin.orgsEyebrow')}
        title={org?.name ?? t('admin.orgsTitle')}
        description={
          modalTab === 'links'
            ? t('admin.orgsLinksHint')
            : modalTab === 'media'
              ? t('admin.orgsMediaHint')
              : t('admin.orgsProfileHint')
        }
        size="xl"
        dismissible={!busy && !deletingLinkId}
        footer={
          <>
            {isView ? (
              <>
                <Button type="button" variant="secondary" onClick={modal.close}>
                  {t('common.close')}
                </Button>
                {org && org.verificationStatus !== 'VERIFIED' ? (
                  <Button type="button" variant="outline" disabled={busy} onClick={() => void verify()}>
                    {busy ? t('common.working') : t('admin.verifyOrg')}
                  </Button>
                ) : null}
                <Button type="button" disabled={busy} onClick={() => org && modal.setMode('edit')}>
                  {t('common.edit')}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="secondary" disabled={busy} onClick={modal.close}>
                  {t('common.cancel')}
                </Button>
                {modalTab === 'profile' || modalTab === 'media' ? (
                  <Button type="button" disabled={busy} onClick={() => void saveAll()}>
                    {busy ? t('common.working') : t('common.save')}
                  </Button>
                ) : null}
              </>
            )}
          </>
        }
      >
        {error && modal.open ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-pequena text-red-800">
            {error}
          </p>
        ) : null}

        {org && draft ? (
          <div className="space-y-4">
            <div className="flex gap-1 border-b border-cac-line pb-0">
              {(
                [
                  ['profile', t('admin.orgsTabProfile')],
                  ['media', t('admin.orgsTabMedia')],
                  ['links', `${t('admin.orgsTabLinks')}${links.length ? ` (${links.length})` : ''}`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setModalTab(key)}
                  className={`-mb-px border-b-2 px-3 py-2 text-pequena font-bold transition ${
                    modalTab === key
                      ? 'border-cac-green text-cac-navy'
                      : 'border-transparent text-cac-muted hover:text-cac-navy'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {modalTab === 'profile' ? (
              isView ? (
                <>
                  <div className="flex items-start gap-3 rounded-xl border border-cac-line bg-white p-4">
                    {resolveMediaUrl(org.logoUrl) ? (
                      <img
                        src={resolveMediaUrl(org.logoUrl)!}
                        alt=""
                        className="size-16 rounded-xl border border-cac-line object-cover"
                      />
                    ) : (
                      <span className="grid size-16 place-items-center rounded-xl bg-cac-navy text-media font-bold text-[#90d6b6]">
                        {org.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-media font-bold text-cac-navy">{org.name}</p>
                      <p className="text-pequena text-cac-muted">
                        {org.slug}
                        {org.country ? ` · ${org.country}` : ''}
                        {org.region ? ` · ${org.region}` : ''}
                      </p>
                      {org.website ? (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-pequena font-bold text-cac-green hover:underline"
                        >
                          {org.website}
                        </a>
                      ) : null}
                      {org.summary ? (
                        <p className="mt-2 text-pequena leading-relaxed text-cac-navy/90">{org.summary}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded-xl border border-cac-line bg-white p-4">
                    <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                      {t('admin.publishKindsLabel')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(org.publishKinds ?? []).length ? (
                        (org.publishKinds ?? []).map((k) => (
                          <span
                            key={k}
                            className="rounded-full bg-cac-green3 px-2.5 py-1 text-mini font-bold text-cac-navy"
                          >
                            {t(`admin.publishKind.${k}`)}
                          </span>
                        ))
                      ) : (
                        <span className="text-pequena text-cac-muted">—</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                        {t('admin.orgsProfileName')}
                      </span>
                      <input
                        value={draft.name}
                        onChange={(e) => patchDraft({ name: e.target.value })}
                        className="w-full rounded-xl border border-cac-line bg-white px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                        {t('admin.orgsProfileSummary')}
                      </span>
                      <textarea
                        value={draft.summary}
                        onChange={(e) => patchDraft({ summary: e.target.value })}
                        rows={3}
                        className="w-full rounded-xl border border-cac-line bg-white px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                        {t('admin.orgsProfileWebsite')}
                      </span>
                      <input
                        type="url"
                        value={draft.website}
                        onChange={(e) => patchDraft({ website: e.target.value })}
                        placeholder="https://"
                        className="w-full rounded-xl border border-cac-line bg-white px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
                      />
                    </label>
                    <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                      <RegionCountryFields
                        regionName={`org-region-${org.id}`}
                        countryName={`org-country-${org.id}`}
                        region={draft.region}
                        country={draft.country}
                        onRegionChange={(value) => patchDraft({ region: value })}
                        onCountryChange={(value) => patchDraft({ country: value })}
                        required
                      />
                    </div>
                  </div>
                  <PublishKindsPicker
                    idPrefix={`org-modal-${org.id}`}
                    value={draft.publishKinds}
                    onChange={(next) => patchDraft({ publishKinds: next })}
                  />
                </>
              )
            ) : modalTab === 'media' ? (
              isView ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-cac-line bg-white p-4">
                    <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                      {t('rep.orgLogo')}
                    </p>
                    <div className="mt-3">
                      {resolveMediaUrl(org.logoUrl) ? (
                        <img
                          src={resolveMediaUrl(org.logoUrl)!}
                          alt=""
                          className="size-20 rounded-xl border border-cac-line object-contain p-1"
                        />
                      ) : (
                        <span className="text-pequena text-cac-muted">{t('rep.orgLogoEmpty')}</span>
                      )}
                    </div>
                  </div>
                  {(draft.publishKinds.length ? draft.publishKinds : []).map((kind) => {
                    const url = resolveMediaUrl(orgBannerCurrentUrl(org, kind));
                    const link = org[ORG_BANNER_LINK_FIELD[kind]];
                    return (
                      <div key={kind} className="rounded-xl border border-cac-line bg-white p-4">
                        <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                          {t('admin.orgBannerLabel', { kind: t(`admin.publishKind.${kind}`) })}
                        </p>
                        <div className="mt-3 aspect-[6/1] w-full max-w-md overflow-hidden border border-cac-line bg-[#edf1f3]">
                          {url ? (
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full place-items-center text-mini text-cac-muted">
                              {t('catalog.bannerImageEmpty')}
                            </div>
                          )}
                        </div>
                        {link ? (
                          <p className="mt-2 truncate text-pequena text-cac-green">{link}</p>
                        ) : (
                          <p className="mt-2 text-pequena text-cac-muted">{t('catalog.bannerLinkEmpty')}</p>
                        )}
                      </div>
                    );
                  })}
                  {!draft.publishKinds.length ? (
                    <p className="rounded-xl border border-dashed border-cac-line bg-white px-4 py-6 text-center text-media text-cac-muted">
                      {t('admin.orgsMediaNoKinds')}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-5">
                  <OrganizationLogoField
                    file={draft.logoFile}
                    currentUrl={org.logoUrl}
                    onChange={(file) => patchDraft({ logoFile: file })}
                  />
                  {(draft.publishKinds.length ? draft.publishKinds : []).map((kind) => (
                    <BannerImageField
                      key={kind}
                      label={t('admin.orgBannerLabel', { kind: t(`admin.publishKind.${kind}`) })}
                      hint={t('admin.orgBannerHint')}
                      currentUrl={orgBannerCurrentUrl(org, kind)}
                      file={draft.bannerFiles[kind] ?? null}
                      onChange={(file) =>
                        patchDraft({
                          bannerFiles: { ...draft.bannerFiles, [kind]: file },
                        })
                      }
                      linkValue={draft.bannerLinks[kind] ?? ''}
                      onLinkChange={(value) =>
                        patchDraft({
                          bannerLinks: { ...draft.bannerLinks, [kind]: value },
                        })
                      }
                    />
                  ))}
                  {!draft.publishKinds.length ? (
                    <p className="rounded-xl border border-dashed border-cac-line bg-[#fbfcfb] px-4 py-6 text-center text-media text-cac-muted">
                      {t('admin.orgsMediaNoKinds')}
                    </p>
                  ) : null}
                </div>
              )
            ) : (
              <div className="space-y-4">
                {linksLoading ? (
                  <p className="rounded-xl border border-cac-line bg-white px-4 py-6 text-center text-media text-cac-muted">
                    {t('admin.orgsLinksLoading')}
                  </p>
                ) : !links.length ? (
                  <p className="rounded-xl border border-dashed border-cac-line bg-white px-4 py-8 text-center text-media text-cac-muted">
                    {t('admin.orgsLinksEmpty')}
                  </p>
                ) : (
                  <>
                    {renderLinkGroup(t('admin.orgsLinkStatus.APPROVED'), authorizedLinks)}
                    {renderLinkGroup(t('admin.orgsLinkStatus.REQUESTED'), requestedLinks)}
                  </>
                )}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
