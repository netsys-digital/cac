import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BannerPosition,
  ORG_BANNER_FIELD,
  ORG_BANNER_LINK_FIELD,
  ORG_BANNER_POSITION_FIELD,
  ORG_PUBLISH_KINDS,
  type BannerPosition as BannerPositionType,
  type OrgPublishKind,
} from '@cac/shared';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { orgApi, type MyOrgMedia } from '../../api/orgApi';
import { Modal } from '../../components/Modal';
import { useModalState } from '../../components/useModalState';
import { BannerImageField } from '../../components/forms/BannerImageField';
import { OrganizationLogoField } from '../../components/forms/OrganizationLogoField';
import { resolveMediaUrl } from '../../components/forms/RepresentativeImageField';

type OrgModalTab = 'profile' | 'media';

type MediaDraft = {
  logoFile: File | null;
  bannerFiles: Partial<Record<OrgPublishKind, File | null>>;
  bannerLinks: Partial<Record<OrgPublishKind, string>>;
  bannerPositions: Partial<Record<OrgPublishKind, BannerPositionType>>;
  publishKinds: OrgPublishKind[];
};

function draftFromOrg(org: MyOrgMedia): MediaDraft {
  return {
    logoFile: null,
    bannerFiles: {},
    bannerLinks: Object.fromEntries(
      ORG_PUBLISH_KINDS.map((kind) => [kind, org[ORG_BANNER_LINK_FIELD[kind]] ?? '']),
    ) as Partial<Record<OrgPublishKind, string>>,
    bannerPositions: Object.fromEntries(
      ORG_PUBLISH_KINDS.map((kind) => [
        kind,
        org[ORG_BANNER_POSITION_FIELD[kind]] ?? BannerPosition.ABOVE_FOOTER,
      ]),
    ) as Partial<Record<OrgPublishKind, BannerPositionType>>,
    publishKinds: [...(org.publishKinds ?? [])],
  };
}

function orgBannerCurrentUrl(org: MyOrgMedia, kind: OrgPublishKind): string | null {
  return org[ORG_BANNER_FIELD[kind]] ?? null;
}

function statusClass(status: string) {
  if (status === 'VERIFIED') return 'bg-cac-green3 text-cac-green';
  if (status === 'REJECTED') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-900';
}

export function MyOrganizationPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const modal = useModalState<MyOrgMedia>();
  const [items, setItems] = useState<MyOrgMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<MediaDraft | null>(null);
  const [modalTab, setModalTab] = useState<OrgModalTab>('media');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await orgApi.listMine(accessToken);
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('orgPage.loadError'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (modal.open && modal.item) {
      setDraft(draftFromOrg(modal.item));
      setModalTab(modal.mode === 'edit' ? 'media' : 'profile');
      setError('');
    } else {
      setDraft(null);
    }
  }, [modal.open, modal.item, modal.mode]);

  const org = modal.item;
  const isView = modal.mode === 'view';

  function patchDraft(patch: Partial<MediaDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function saveMedia() {
    if (!accessToken || !org || !draft) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await orgApi.updateMedia(accessToken, org.id, {
        technologyBannerLinkUrl: (draft.bannerLinks.TECHNOLOGY ?? '').trim() || null,
        challengeBannerLinkUrl: (draft.bannerLinks.CHALLENGE ?? '').trim() || null,
        fundingOfferBannerLinkUrl: (draft.bannerLinks.FUNDING_OFFER ?? '').trim() || null,
        successCaseBannerLinkUrl: (draft.bannerLinks.SUCCESS_CASE ?? '').trim() || null,
        technologyBannerPosition: draft.bannerPositions.TECHNOLOGY ?? BannerPosition.ABOVE_FOOTER,
        challengeBannerPosition: draft.bannerPositions.CHALLENGE ?? BannerPosition.ABOVE_FOOTER,
        fundingOfferBannerPosition:
          draft.bannerPositions.FUNDING_OFFER ?? BannerPosition.ABOVE_FOOTER,
        successCaseBannerPosition: draft.bannerPositions.SUCCESS_CASE ?? BannerPosition.ABOVE_FOOTER,
      });
      if (draft.logoFile) {
        await orgApi.uploadLogo(accessToken, org.id, draft.logoFile);
      }
      for (const kind of ORG_PUBLISH_KINDS) {
        const file = draft.bannerFiles[kind];
        if (file) await orgApi.uploadBanner(accessToken, org.id, kind, file);
      }
      setMessage(t('orgPage.saved', { name: org.name }));
      modal.close();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('orgPage.saveError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
          {t('orgPage.badge')}
        </p>
        <h1 className="text-grande font-bold text-cac-navy">{t('orgPage.listTitle')}</h1>
        <p className="max-w-2xl text-pequena text-cac-muted">{t('orgPage.listHint')}</p>
      </header>

      {message ? (
        <p className="rounded-xl border border-cac-line bg-cac-green3/40 px-4 py-3 text-media font-semibold text-cac-navy">
          {message}
        </p>
      ) : null}
      {error && !modal.open ? (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-media font-semibold text-red-800">{error}</p>
          <Button type="button" variant="secondary" onClick={() => void load()}>
            {t('orgPage.retry')}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-media text-cac-muted">{t('orgPage.loading')}</p>
      ) : !items.length ? (
        <div className="space-y-4 rounded-2xl border border-dashed border-cac-line bg-white px-5 py-8 text-center">
          <p className="text-media font-bold text-cac-navy">{t('orgPage.emptyTitle')}</p>
          <p className="text-pequena text-cac-muted">{t('orgPage.emptyHint')}</p>
          <Link
            to="/org/representation"
            className="inline-flex rounded-[10px] bg-cac-green2 px-4 py-2.5 text-pequena font-extrabold text-white hover:brightness-105"
          >
            {t('orgPage.goRepresentation')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
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
        </ul>
      )}

      <Modal
        open={modal.open}
        onClose={modal.close}
        mode={modal.mode}
        badge={t('orgPage.badge')}
        title={org?.name ?? t('orgPage.listTitle')}
        description={
          modalTab === 'media' ? t('admin.orgsMediaHint') : t('orgPage.profileReadOnlyHint')
        }
        size="xl"
        dismissible={!busy}
        footer={
          <>
            {isView ? (
              <>
                <Button type="button" variant="secondary" onClick={modal.close}>
                  {t('common.close')}
                </Button>
                <Button type="button" disabled={busy} onClick={() => org && modal.setMode('edit')}>
                  {t('common.edit')}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="secondary" disabled={busy} onClick={modal.close}>
                  {t('common.cancel')}
                </Button>
                {modalTab === 'media' ? (
                  <Button type="button" disabled={busy} onClick={() => void saveMedia()}>
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
              <>
                {!isView ? (
                  <p className="rounded-lg border border-cac-line bg-[#fbfcfb] px-3 py-2 text-pequena text-cac-muted">
                    {t('orgPage.profileReadOnlyHint')}
                  </p>
                ) : null}
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
            ) : isView ? (
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
                    {t('orgPage.noKinds')}
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
                    positionValue={draft.bannerPositions[kind] ?? BannerPosition.ABOVE_FOOTER}
                    onPositionChange={(value) =>
                      setDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              bannerPositions: { ...prev.bannerPositions, [kind]: value },
                            }
                          : prev,
                      )
                    }
                  />
                ))}
                {!draft.publishKinds.length ? (
                  <p className="rounded-xl border border-dashed border-cac-line bg-[#fbfcfb] px-4 py-6 text-center text-media text-cac-muted">
                    {t('orgPage.noKinds')}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
