import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserRole, UserStatus, formatDateTime } from '@cac/shared';
import { Button, Input, useDialog } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { adminUsersApi, type AdminUser } from '../../api/adminUsersApi';
import { Modal } from '../../components/Modal';
import { useModalState } from '../../components/useModalState';

type RoleFilter = 'ALL' | UserRole;
type StatusFilter = 'ALL' | UserStatus;

type Draft = {
  name: string;
  email: string;
  role: UserRole;
  password: string;
};

const ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.CURADOR,
  UserRole.ORG_ADMIN,
  UserRole.ORG_MEMBER,
];

function draftFromUser(user: AdminUser): Draft {
  return { name: user.name, email: user.email, role: user.role, password: '' };
}

function statusClass(status: string) {
  if (status === UserStatus.DISABLED) return 'bg-red-100 text-red-800';
  return 'bg-cac-green3 text-cac-navy';
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const { user: me, accessToken } = useAuth();
  const dialog = useDialog();
  const modal = useModalState<AdminUser>();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const [q, setQ] = useState('');
  const [role, setRole] = useState<RoleFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await adminUsersApi.list(accessToken);
      setItems(res.items ?? []);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : t('admin.usersError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (modal.open && modal.item) {
      const fresh = items.find((u) => u.id === modal.item!.id) ?? modal.item;
      setDraft(draftFromUser(fresh));
    } else if (!modal.open) {
      setDraft(null);
    }
  }, [modal.open, modal.item, items]);

  const statusCounts = useMemo(() => {
    const base = { ACTIVE: 0, DISABLED: 0, ALL: items.length };
    for (const u of items) {
      if (u.status === UserStatus.ACTIVE) base.ACTIVE += 1;
      if (u.status === UserStatus.DISABLED) base.DISABLED += 1;
    }
    return base;
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((u) => {
      if (role !== 'ALL' && u.role !== role) return false;
      if (status !== 'ALL' && u.status !== status) return false;
      if (!needle) return true;
      const hay = `${u.name} ${u.email}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q, role, status]);

  const hasActiveFilters = q.trim().length > 0 || role !== 'ALL' || status !== 'ALL';

  function actionError(e: unknown): string {
    const code = e instanceof Error ? e.message : '';
    if (code === 'last_admin') return t('admin.usersLastAdmin');
    if (code === 'cannot_self_delete') return t('admin.usersNoSelfDelete');
    if (code === 'cannot_self_disable') return t('admin.usersNoSelfDisable');
    if (code === 'cannot_self_role') return t('admin.usersNoSelfRole');
    if (code === 'email_taken') return t('admin.usersEmailTaken');
    return t('admin.usersError');
  }

  function patchDraft(patch: Partial<Draft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function save() {
    if (!accessToken || !modal.item || !draft) return;
    if (!draft.name.trim() || draft.name.trim().length < 2) {
      setError(t('admin.usersError'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body: { name: string; email: string; role?: UserRole } = {
        name: draft.name.trim(),
        email: draft.email.trim(),
      };
      if (draft.role !== modal.item.role) body.role = draft.role;
      await adminUsersApi.update(accessToken, modal.item.id, body);
      setMessage(t('admin.usersSaved', { name: draft.name.trim() }));
      modal.close();
      await load();
    } catch (e) {
      setError(actionError(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(item: AdminUser) {
    if (!accessToken) return;
    if (item.status === UserStatus.ACTIVE) {
      const ok = await dialog.confirm({
        title: t('admin.usersDisable'),
        message: t('admin.usersConfirmDisable', { name: item.name }),
        confirmLabel: t('admin.usersDisable'),
        tone: 'danger',
      });
      if (!ok) return;
    }
    setBusy(true);
    setError('');
    try {
      if (item.status === UserStatus.DISABLED) {
        await adminUsersApi.enable(accessToken, item.id);
        setMessage(t('admin.usersEnabled', { name: item.name }));
      } else {
        await adminUsersApi.disable(accessToken, item.id);
        setMessage(t('admin.usersDisabled', { name: item.name }));
      }
      await load();
    } catch (e) {
      setError(actionError(e));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!accessToken || !modal.item || !draft) return;
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const res = await adminUsersApi.resetPassword(
        accessToken,
        modal.item.id,
        draft.password.trim() || undefined,
      );
      setTempPassword(res.temporaryPassword);
      setDraft((prev) => (prev ? { ...prev, password: '' } : prev));
      setMessage(t('admin.usersPasswordReset', { name: modal.item.name }));
    } catch (e) {
      setError(actionError(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(item: AdminUser) {
    if (!accessToken) return;
    const ok = await dialog.confirm({
      title: t('common.delete'),
      message: t('admin.usersConfirmDelete', { name: item.name }),
      confirmLabel: t('common.delete'),
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    setError('');
    try {
      await adminUsersApi.remove(accessToken, item.id);
      setMessage(t('admin.usersDeleted', { name: item.name }));
      if (modal.item?.id === item.id) modal.close();
      await load();
    } catch (e) {
      setError(actionError(e));
    } finally {
      setBusy(false);
    }
  }

  async function copyTempPassword() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const current = modal.item ? (items.find((u) => u.id === modal.item!.id) ?? modal.item) : null;
  const isView = modal.mode === 'view';
  const isSelf = Boolean(current && me?.id === current.id);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
        <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
          {t('admin.usersEyebrow')}
        </p>
        <h1 className="mt-1 text-grande font-bold text-cac-navy">{t('admin.usersTitle')}</h1>
        <p className="mt-2 max-w-3xl text-media text-cac-muted">{t('admin.usersSupport')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['ALL', statusCounts.ALL],
              [UserStatus.ACTIVE, statusCounts.ACTIVE],
              [UserStatus.DISABLED, statusCounts.DISABLED],
            ] as const
          ).map(([key, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key === 'ALL' ? 'ALL' : key)}
              className={`rounded-full border px-3 py-1.5 text-pequena font-bold transition ${
                status === key
                  ? 'border-cac-navy bg-cac-navy text-white'
                  : 'border-cac-line bg-[#fbfcfb] text-cac-navy hover:bg-cac-green3'
              }`}
            >
              {key === 'ALL' ? t('admin.usersFilterAllStatus') : t(`admin.usersStatus.${key}`)} {count}
            </button>
          ))}
        </div>
      </header>

      <section className="space-y-3 rounded-[18px] border border-cac-line bg-white p-4 shadow-cac md:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('admin.usersFilterSearch')}
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin.usersFilterSearchPlaceholder')}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            />
          </label>
          <label className="min-w-[160px]">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('admin.usersFilterRole')}
            </span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleFilter)}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            >
              <option value="ALL">{t('admin.usersFilterAllRoles')}</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`)}
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
                setRole('ALL');
                setStatus('ALL');
              }}
            >
              {t('admin.orgsFilterClear')}
            </Button>
          ) : null}
        </div>
        <p className="text-pequena text-cac-muted">
          {t('admin.usersFilteredTotal', { count: filtered.length, total: items.length })}
        </p>
      </section>

      {tempPassword ? (
        <div className="rounded-xl border border-cac-green bg-cac-green3/40 px-4 py-3">
          <p className="text-media font-semibold text-cac-navy">{t('admin.usersTempPasswordHint')}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-white px-3 py-1.5 font-mono text-media font-bold text-cac-navy">
              {tempPassword}
            </code>
            <Button type="button" variant="secondary" onClick={() => void copyTempPassword()}>
              {copied ? t('admin.usersCopied') : t('admin.usersCopy')}
            </Button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="rounded-xl border border-cac-line bg-cac-green3/40 px-4 py-3 text-media font-semibold text-cac-navy">
          {message}
        </p>
      ) : null}
      {error && !modal.open ? (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-media font-semibold text-red-800">{error}</p>
          <Button type="button" variant="secondary" onClick={() => void load()}>
            {t('admin.usersRetry')}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-media text-cac-muted">{t('dash.loading')}</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li key={item.id} className="rounded-2xl border border-cac-line bg-white p-4 shadow-cac">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[linear-gradient(145deg,#0a2440,#1a4d4a)] text-pequena font-bold text-[#90d6b6]">
                    {initials(item.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-media font-bold text-cac-navy">
                      {item.name}
                      {me?.id === item.id ? (
                        <span className="ml-2 text-mini font-bold uppercase tracking-wide text-cac-green">
                          {t('admin.usersYou')}
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-pequena text-cac-muted">{item.email}</p>
                    <p className="mt-1 text-mini text-cac-muted">
                      {t(`roles.${item.role}`)}
                      {item.memberships.length
                        ? ` · ${item.memberships.map((m) => m.organization.name).join(', ')}`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-mini font-bold uppercase tracking-wide ${statusClass(item.status)}`}
                  >
                    {t(`admin.usersStatus.${item.status}`)}
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
          ))}
          {!filtered.length ? (
            <li className="rounded-2xl border border-dashed border-cac-line bg-white px-4 py-8 text-center text-media text-cac-muted">
              {items.length ? t('admin.usersFilterEmpty') : t('admin.usersEmpty')}
            </li>
          ) : null}
        </ul>
      )}

      <Modal
        open={modal.open}
        onClose={modal.close}
        mode={modal.mode}
        badge={t('admin.usersEyebrow')}
        title={current?.name ?? t('admin.usersTitle')}
        description={current?.email}
        size="lg"
        dismissible={!busy}
        footer={
          isView ? (
            <>
              <Button type="button" variant="secondary" onClick={modal.close}>
                {t('common.close')}
              </Button>
              <Button type="button" disabled={busy} onClick={() => current && modal.setMode('edit')}>
                {t('common.edit')}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" disabled={busy} onClick={modal.close}>
                {t('common.cancel')}
              </Button>
              <Button type="button" disabled={busy} onClick={() => void save()}>
                {busy ? t('common.working') : t('common.save')}
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

        {current && draft ? (
          <div className="space-y-4">
            {isView ? (
              <dl className="space-y-3 rounded-xl border border-cac-line bg-white p-4 text-media">
                <div>
                  <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">
                    {t('auth.name')}
                  </dt>
                  <dd className="font-bold text-cac-navy">{current.name}</dd>
                </div>
                <div>
                  <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">
                    {t('auth.email')}
                  </dt>
                  <dd className="text-cac-navy">{current.email}</dd>
                </div>
                <div>
                  <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">
                    {t('admin.usersRole')}
                  </dt>
                  <dd className="text-cac-navy">{t(`roles.${current.role}`)}</dd>
                </div>
                <div>
                  <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">
                    {t('admin.usersFilterStatus')}
                  </dt>
                  <dd>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-mini font-bold uppercase tracking-wide ${statusClass(current.status)}`}
                    >
                      {t(`admin.usersStatus.${current.status}`)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">
                    {t('admin.usersOrgs')}
                  </dt>
                  <dd className="text-cac-navy">
                    {current.memberships.length
                      ? current.memberships.map((m) => m.organization.name).join(', ')
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">
                    {t('admin.usersCreated')}
                  </dt>
                  <dd className="text-cac-navy">{formatDateTime(current.createdAt, i18n.language)}</dd>
                </div>
              </dl>
            ) : (
              <div className="space-y-3 rounded-xl border border-cac-line bg-white p-4">
                <Input
                  label={t('auth.name')}
                  value={draft.name}
                  onChange={(e) => patchDraft({ name: e.target.value })}
                  required
                  disabled={busy}
                />
                <Input
                  label={t('auth.email')}
                  type="email"
                  value={draft.email}
                  onChange={(e) => patchDraft({ email: e.target.value })}
                  required
                  disabled={busy}
                />
                <label className="flex flex-col gap-1">
                  <span className="text-mini font-extrabold uppercase tracking-wide text-cac-muted">
                    {t('admin.usersRole')}
                  </span>
                  <select
                    value={draft.role}
                    onChange={(e) => patchDraft({ role: e.target.value as UserRole })}
                    disabled={busy || isSelf}
                    className="rounded-xl border border-cac-line bg-white px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green disabled:opacity-60"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`roles.${r}`)}
                      </option>
                    ))}
                  </select>
                  {isSelf ? (
                    <span className="text-pequena text-cac-muted">{t('admin.usersNoSelfRole')}</span>
                  ) : null}
                </label>
              </div>
            )}

            <section className="space-y-3 rounded-xl border border-cac-line bg-[#fbfcfb] p-4">
              <p className="text-pequena font-extrabold uppercase tracking-wide text-cac-muted">
                {t('admin.usersPasswordTitle')}
              </p>
              <p className="text-pequena text-cac-muted">{t('admin.usersPasswordHint')}</p>
              {!isView ? (
                <Input
                  label={t('auth.password')}
                  type="password"
                  value={draft.password}
                  onChange={(e) => patchDraft({ password: e.target.value })}
                  disabled={busy}
                  autoComplete="new-password"
                />
              ) : null}
              <Button type="button" variant="outline" disabled={busy} onClick={() => void resetPassword()}>
                {busy ? t('common.working') : t('admin.usersResetPassword')}
              </Button>
            </section>

            <div className="flex flex-wrap gap-2">
              {current.status === UserStatus.DISABLED ? (
                <Button type="button" variant="outline" disabled={busy} onClick={() => void toggleStatus(current)}>
                  {t('admin.usersEnable')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy || isSelf}
                  onClick={() => void toggleStatus(current)}
                >
                  {t('admin.usersDisable')}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                disabled={busy || isSelf}
                onClick={() => void removeUser(current)}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
