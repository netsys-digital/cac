import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi } from '../../api/catalogApi';
import { Modal } from '../../components/Modal';
import { useModalState } from '../../components/useModalState';

type DomainItem = { id: string; key: string; labelPt: string; labelEn: string; sortOrder: number };

type DomainDraft = {
  key: string;
  labelPt: string;
  labelEn: string;
};

const emptyDraft = (): DomainDraft => ({ key: '', labelPt: '', labelEn: '' });

export function AdminDomainsPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const modal = useModalState<DomainItem>();
  const [grouping, setGrouping] = useState('region');
  const [items, setItems] = useState<DomainItem[]>([]);
  const [draft, setDraft] = useState<DomainDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(
    async (g = grouping) => {
      const res = await catalogApi.listDomains(g);
      setItems(res.items);
    },
    [grouping],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!modal.open) {
      setDraft(emptyDraft());
      setError('');
      return;
    }
    if (modal.mode === 'create') {
      setDraft(emptyDraft());
    } else if (modal.item) {
      setDraft({
        key: modal.item.key,
        labelPt: modal.item.labelPt,
        labelEn: modal.item.labelEn,
      });
    }
  }, [modal.open, modal.mode, modal.item]);

  async function onSave() {
    if (!accessToken) return;
    if (!draft.key.trim() || !draft.labelPt.trim() || !draft.labelEn.trim()) {
      setError(t('admin.domainsFormRequired'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (modal.mode === 'create') {
        await catalogApi.createDomain(accessToken, {
          grouping,
          key: draft.key.trim(),
          labelPt: draft.labelPt.trim(),
          labelEn: draft.labelEn.trim(),
          sortOrder: items.length + 1,
        });
        setMessage(t('admin.domainsCreated'));
      } else if (modal.item) {
        await catalogApi.updateDomain(accessToken, modal.item.id, {
          key: draft.key.trim(),
          labelPt: draft.labelPt.trim(),
          labelEn: draft.labelEn.trim(),
        });
        setMessage(t('admin.domainsUpdated'));
      }
      modal.close();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.domainsError'));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(item: DomainItem) {
    if (!accessToken) return;
    setBusy(true);
    setError('');
    try {
      await catalogApi.deleteDomain(accessToken, item.id);
      setMessage(t('admin.domainsDeleted'));
      if (modal.item?.id === item.id) modal.close();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.domainsError'));
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
            {t('admin.domainsEyebrow')}
          </p>
          <h1 className="mt-1 text-grande font-bold text-cac-navy">{t('admin.domainsTitle')}</h1>
        </div>
        <Button type="button" onClick={() => modal.openCreate()}>
          {t('common.add')}
        </Button>
      </header>

      <label className="flex max-w-xs flex-col gap-1">
        <span className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">
          {t('admin.grouping')}
        </span>
        <select
          className="rounded-xl border border-cac-line bg-white px-3.5 py-2.5 text-media text-cac-navy"
          value={grouping}
          onChange={(e) => setGrouping(e.target.value)}
        >
          <option value="region">region</option>
          <option value="country">country</option>
          <option value="need_type">need_type</option>
          <option value="maturity">maturity</option>
        </select>
      </label>

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
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cac-line bg-white px-4 py-3 shadow-cac"
          >
            <span className="text-media text-cac-navy">
              <strong>{item.key}</strong> — {item.labelPt} / {item.labelEn}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => modal.openView(item)}>
                {t('common.view')}
              </Button>
              <Button type="button" onClick={() => modal.openEdit(item)}>
                {t('common.edit')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => void onDelete(item)}
              >
                {t('common.delete')}
              </Button>
            </div>
          </li>
        ))}
        {!items.length ? (
          <li className="rounded-2xl border border-dashed border-cac-line bg-white px-4 py-8 text-center text-media text-cac-muted">
            {t('admin.domainsEmpty')}
          </li>
        ) : null}
      </ul>

      <Modal
        open={modal.open}
        onClose={modal.close}
        mode={modal.mode}
        badge={t('admin.domainsEyebrow')}
        title={
          modal.mode === 'create'
            ? t('admin.createDomain')
            : modal.item
              ? modal.item.key
              : t('admin.domainsTitle')
        }
        size="md"
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
              <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">key</dt>
              <dd className="font-bold text-cac-navy">{modal.item.key}</dd>
            </div>
            <div>
              <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">labelPt</dt>
              <dd className="text-cac-navy">{modal.item.labelPt}</dd>
            </div>
            <div>
              <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">labelEn</dt>
              <dd className="text-cac-navy">{modal.item.labelEn}</dd>
            </div>
          </dl>
        ) : (
          <div className="space-y-3 rounded-xl border border-cac-line bg-white p-4">
            <Input
              label="key"
              value={draft.key}
              onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
              required
              disabled={busy}
            />
            <Input
              label="labelPt"
              value={draft.labelPt}
              onChange={(e) => setDraft((d) => ({ ...d, labelPt: e.target.value }))}
              required
              disabled={busy}
            />
            <Input
              label="labelEn"
              value={draft.labelEn}
              onChange={(e) => setDraft((d) => ({ ...d, labelEn: e.target.value }))}
              required
              disabled={busy}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
