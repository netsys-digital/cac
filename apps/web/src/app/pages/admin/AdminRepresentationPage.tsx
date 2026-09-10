import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ORG_PUBLISH_KINDS, type OrgPublishKind } from '@cac/shared';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { useStaffTasks } from '../../auth/StaffTasksContext';
import { catalogApi, type RepresentationRequest } from '../../api/catalogApi';
import { Modal } from '../../components/Modal';
import { MediaViewer, type MediaViewerItem } from '../../components/MediaViewer';
import { useModalState } from '../../components/useModalState';
import { resolveMediaUrl } from '../../components/forms/RepresentativeImageField';
import { PublishKindsPicker } from '../../components/forms/PublishKindsPicker';

function isPdf(url: string) {
  return /\.pdf($|\?)/i.test(url);
}

function ProofDocButton({
  url,
  label,
  onOpen,
}: {
  url: string;
  label: string;
  onOpen: () => void;
}) {
  const resolved = resolveMediaUrl(url);
  if (!resolved) return null;
  const pdf = isPdf(url);

  return (
    <button
      type="button"
      onClick={onOpen}
      title={label}
      className="group flex min-w-[9rem] max-w-[11rem] flex-col overflow-hidden rounded-[12px] border border-cac-line bg-[#fbfcfb] text-left transition hover:border-cac-green/40 hover:bg-white"
    >
      <span className="grid h-28 w-full place-items-center bg-[#edf1f3]">
        {pdf ? (
          <span className="rounded-md bg-cac-navy px-2.5 py-1 text-mini font-extrabold tracking-wide text-white">
            PDF
          </span>
        ) : (
          <img src={resolved} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
      </span>
      <span className="px-2.5 py-2 text-pequena font-bold text-cac-navy group-hover:text-cac-green">
        {label}
      </span>
    </button>
  );
}

export function AdminRepresentationPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { refresh } = useStaffTasks();
  const modal = useModalState<RepresentationRequest>();
  const [items, setItems] = useState<RepresentationRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishKinds, setPublishKinds] = useState<OrgPublishKind[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await catalogApi.adminRepresentations(accessToken);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!modal.open || !modal.item) {
      setPublishKinds([]);
      setViewerIndex(null);
      return;
    }
    const existing = (modal.item.organization as { publishKinds?: OrgPublishKind[] } | undefined)
      ?.publishKinds;
    setPublishKinds(existing && existing.length > 0 ? existing : [...ORG_PUBLISH_KINDS]);
  }, [modal.open, modal.item]);

  async function approve() {
    if (!accessToken || !modal.item) return;
    if (!publishKinds.length) {
      setError(t('admin.publishKindsRequired'));
      return;
    }
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await catalogApi.approveRepresentation(accessToken, modal.item.id, { publishKinds });
      setMessage(t('admin.repApproved'));
      modal.close();
      await load();
      await refresh();
    } catch {
      setError(t('admin.repError'));
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!accessToken || !modal.item) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await catalogApi.rejectRepresentation(accessToken, modal.item.id);
      setMessage(t('admin.repRejected'));
      modal.close();
      await load();
      await refresh();
    } catch {
      setError(t('admin.repError'));
    } finally {
      setBusy(false);
    }
  }

  const item = modal.item;
  const isView = modal.mode === 'view';

  const mediaItems = useMemo((): MediaViewerItem[] => {
    if (!item) return [];
    const list: MediaViewerItem[] = [];
    if (item.proofDocument1Url) {
      list.push({ url: item.proofDocument1Url, label: t('admin.repDoc1') });
    }
    if (item.proofDocument2Url) {
      list.push({ url: item.proofDocument2Url, label: t('admin.repDoc2') });
    }
    return list;
  }, [item, t]);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
        <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
          {t('curator.queueRep')}
        </p>
        <h1 className="mt-1 text-grande font-bold text-cac-navy">{t('admin.repTitle')}</h1>
        <p className="mt-2 max-w-3xl text-media text-cac-muted">{t('admin.repSupport')}</p>
        <p className="mt-4 inline-flex rounded-full border border-cac-line bg-[#fbfcfb] px-3 py-1.5 text-pequena font-bold text-cac-navy">
          {t('admin.pendingTotal', { count: items.length })}
        </p>
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

      {loading ? (
        <p className="text-media text-cac-muted">{t('dash.loading')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 rounded-2xl border border-cac-line bg-white p-4 shadow-cac sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-media font-bold text-cac-navy">
                  {row.user?.name ?? '—'} · {row.organization?.name ?? '—'}
                </p>
                <p className="text-media text-cac-muted">
                  {row.unit} · {row.linkRole}
                  {row.user?.email ? ` · ${row.user.email}` : ''}
                </p>
                <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-mini font-bold uppercase tracking-wide text-amber-900">
                  {t('admin.repStatusRequested')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => modal.openView(row)}>
                  {t('common.view')}
                </Button>
                <Button type="button" onClick={() => modal.openEdit(row)}>
                  {t('admin.openDecision')}
                </Button>
              </div>
            </li>
          ))}
          {!items.length ? (
            <li className="rounded-2xl border border-dashed border-cac-line bg-white px-4 py-8 text-center text-media text-cac-muted">
              {t('admin.empty')}
            </li>
          ) : null}
        </ul>
      )}

      <Modal
        open={modal.open}
        onClose={modal.close}
        mode={isView ? 'view' : 'edit'}
        badge={t('curator.queueRep')}
        title={item ? `${item.user?.name ?? '—'} · ${item.organization?.name ?? '—'}` : t('admin.repTitle')}
        description={item ? `${item.unit} · ${item.linkRole}` : undefined}
        size="lg"
        dismissible={!busy}
        footer={
          isView ? (
            <>
              <Button type="button" variant="secondary" onClick={modal.close}>
                {t('common.close')}
              </Button>
              <Button type="button" onClick={() => modal.setMode('edit')}>
                {t('admin.openDecision')}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" disabled={busy} onClick={modal.close}>
                {t('common.cancel')}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => void reject()}>
                {t('admin.reject')}
              </Button>
              <Button
                type="button"
                disabled={busy || !publishKinds.length}
                onClick={() => void approve()}
              >
                {busy ? t('common.working') : t('admin.approve')}
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

        {item ? (
          <div className="space-y-4">
            {item.user?.email ? (
              <p className="text-pequena text-cac-muted">{item.user.email}</p>
            ) : null}
            {item.interest ? (
              <p className="rounded-xl border border-cac-line bg-white px-3 py-2 text-media text-cac-navy">
                {item.interest}
              </p>
            ) : null}
            <div className="rounded-xl border border-cac-line bg-white px-3 py-3">
              <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                {t('admin.repDocs')}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {item.proofDocument1Url ? (
                  <ProofDocButton
                    url={item.proofDocument1Url}
                    label={t('admin.repDoc1')}
                    onOpen={() => {
                      const idx = mediaItems.findIndex((m) => m.url === item.proofDocument1Url);
                      setViewerIndex(idx >= 0 ? idx : 0);
                    }}
                  />
                ) : (
                  <span className="text-pequena text-cac-muted">
                    {t('admin.repDoc1')}: {t('admin.repDocMissing')}
                  </span>
                )}
                {item.proofDocument2Url ? (
                  <ProofDocButton
                    url={item.proofDocument2Url}
                    label={t('admin.repDoc2')}
                    onOpen={() => {
                      const idx = mediaItems.findIndex((m) => m.url === item.proofDocument2Url);
                      setViewerIndex(idx >= 0 ? idx : 0);
                    }}
                  />
                ) : (
                  <span className="text-pequena text-cac-muted">
                    {t('admin.repDoc2')}: {t('admin.repDocMissing')}
                  </span>
                )}
              </div>
            </div>

            {!isView ? (
              <PublishKindsPicker
                idPrefix={`rep-modal-${item.id}`}
                value={publishKinds}
                onChange={setPublishKinds}
              />
            ) : (
              <div className="rounded-xl border border-cac-line bg-white p-4">
                <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
                  {t('admin.publishKindsLabel')}
                </p>
                <p className="mt-1 text-pequena text-cac-muted">{t('admin.repViewKindsHint')}</p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {viewerIndex !== null && mediaItems.length > 0 ? (
        <MediaViewer
          items={mediaItems}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onChangeIndex={setViewerIndex}
        />
      ) : null}
    </div>
  );
}
