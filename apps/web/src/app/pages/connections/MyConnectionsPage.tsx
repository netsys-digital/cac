import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { connectionsApi, type Connection } from '../../api/connectionsApi';
import { useMyOrganizations } from '../../hooks/useMyOrganizations';
import { resolveMediaUrl } from '../../components/forms/RepresentativeImageField';

function orgInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function OrgAvatar({ name, logoUrl, size = 'md' }: { name: string; logoUrl?: string | null; size?: 'sm' | 'md' }) {
  const logo = resolveMediaUrl(logoUrl);
  const box = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';
  return (
    <div
      className={`grid ${box} shrink-0 place-items-center overflow-hidden rounded-[12px] border border-cac-line bg-[#edf1f3]`}
    >
      {logo ? (
        <img src={logo} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        <span className="text-mini font-extrabold text-cac-navy">{orgInitials(name) || '—'}</span>
      )}
    </div>
  );
}

function statusClass(status: string) {
  if (status === 'ACCEPTED' || status === 'CONTACT_SHARED') return 'bg-cac-green3 text-cac-navy';
  if (status === 'DECLINED' || status === 'CLOSED' || status === 'EXPIRED') return 'bg-red-100 text-red-900';
  return 'bg-amber-100 text-amber-900';
}

function InfoTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-[160px] flex-1 rounded-[14px] border border-cac-line bg-[#fbfcfb] px-3 py-3">
      <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 6 7.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.9 4.43-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.43 9.9-9.9S17.5 2 12.04 2Zm5.78 14.07c-.24.67-1.4 1.23-1.93 1.3-.5.07-1.12.1-1.81-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.93-4.36-.14-.19-1.15-1.53-1.15-2.92s.73-2.07.99-2.35c.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.59.45.22.53.73 1.84.79 1.97.07.13.11.29.02.47-.09.19-.14.3-.28.47-.14.16-.3.36-.42.49-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.28.13.44.11.6-.07.17-.19.7-.81.89-1.09.19-.27.38-.23.64-.14.27.09 1.7.8 1.99.95.29.14.48.22.55.34.07.13.07.73-.17 1.4Z" />
    </svg>
  );
}

function IconDirectMessage() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ícones decorativos — sem ação por enquanto. */
function PassiveActionIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span
      title={label}
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-full border border-cac-line bg-white text-cac-navy opacity-80"
    >
      {children}
    </span>
  );
}

function ConnectionRow({
  item,
  myOrgIds,
  onAccept,
  onDecline,
  onClose,
}: {
  item: Connection;
  myOrgIds: Set<string>;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const { t } = useTranslation();
  const requesterName = item.requesterOrg?.name ?? '—';
  const targetName = item.targetOrg?.name ?? '—';
  const contactName = item.requesterUser?.name ?? '—';
  const contactRole =
    [item.requesterRole?.linkRole, item.requesterRole?.unit].filter(Boolean).join(' · ') ||
    t('conn.roleUnknown');
  const canActAsTarget = myOrgIds.has(item.targetOrgId);
  const canActAsRequester = myOrgIds.has(item.requesterOrgId);
  const showAcceptDecline = item.status === 'PENDING' && canActAsTarget;
  const showClose =
    (item.status === 'ACCEPTED' || item.status === 'CONTACT_SHARED') &&
    (canActAsTarget || canActAsRequester);

  const objectiveLabel = useMemo(() => {
    if (item.objective === 'KNOW_MORE') return t('conn.objKnow');
    if (item.objective === 'IMPLEMENT_SOLUTION') return t('conn.objImplement');
    if (item.objective === 'PARTNERSHIP') return t('conn.objPartner');
    if (item.objective === 'FUNDING') return t('conn.objFunding');
    return item.objective;
  }, [item.objective, t]);

  const statusLabel = useMemo(() => {
    if (item.status === 'PENDING') return t('conn.statusPending');
    if (item.status === 'ACCEPTED') return t('conn.statusAccepted');
    if (item.status === 'CONTACT_SHARED') return t('conn.statusContactShared');
    if (item.status === 'DECLINED') return t('conn.statusDeclined');
    if (item.status === 'CLOSED') return t('conn.statusClosed');
    if (item.status === 'EXPIRED') return t('conn.statusExpired');
    return item.status;
  }, [item.status, t]);

  return (
    <li className="rounded-2xl border border-cac-line bg-white p-3 shadow-cac md:p-4">
      <div className="mb-3 flex flex-col gap-2 border-b border-cac-line pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-media font-bold text-cac-navy">{contactName}</p>
          <p className="mt-0.5 text-pequena text-cac-muted">{contactRole}</p>
          {item.requesterUser?.email ? (
            <p className="mt-1 truncate text-mini text-cac-muted">{item.requesterUser.email}</p>
          ) : null}
        </div>
        <span
          className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-1 text-mini font-bold uppercase tracking-wide ${statusClass(item.status)}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <InfoTile label={t('conn.cardOrg')}>
          <div className="flex items-center gap-2">
            <OrgAvatar name={requesterName} logoUrl={item.requesterOrg?.logoUrl} size="sm" />
            <span className="text-cac-muted" aria-hidden>
              →
            </span>
            <OrgAvatar name={targetName} logoUrl={item.targetOrg?.logoUrl} size="sm" />
          </div>
          <p className="mt-2 line-clamp-2 text-pequena font-bold leading-snug text-cac-navy">
            {requesterName} → {targetName}
          </p>
        </InfoTile>

        <InfoTile label={t('conn.cardObjective')}>
          <p className="text-pequena font-bold text-cac-navy">{objectiveLabel}</p>
          <p className="mt-0.5 text-mini text-cac-muted">{item.targetType}</p>
          {item.message ? (
            <p className="mt-2 line-clamp-3 text-mini leading-snug text-cac-navy">{item.message}</p>
          ) : null}
          {(showAcceptDecline || showClose) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {showAcceptDecline ? (
                <>
                  <Button onClick={() => onAccept(item.id)}>{t('conn.accept')}</Button>
                  <Button variant="secondary" onClick={() => onDecline(item.id)}>
                    {t('conn.decline')}
                  </Button>
                </>
              ) : null}
              {showClose ? (
                <Button variant="secondary" onClick={() => onClose(item.id)}>
                  {t('conn.close')}
                </Button>
              ) : null}
            </div>
          )}
        </InfoTile>

        <div className="flex min-w-[132px] shrink-0 flex-col rounded-[14px] border border-cac-line bg-[#fbfcfb] px-3 py-3 lg:w-[148px]">
          <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
            {t('conn.cardActions')}
          </p>
          <div className="mt-3 grid grid-cols-2 place-items-center gap-2">
            <PassiveActionIcon label={t('conn.actionEmail')}>
              <IconMail />
            </PassiveActionIcon>
            <PassiveActionIcon label={t('conn.actionWhatsapp')}>
              <IconWhatsApp />
            </PassiveActionIcon>
            <PassiveActionIcon label={t('conn.actionDm')}>
              <IconDirectMessage />
            </PassiveActionIcon>
          </div>
          <p className="mt-auto pt-2 text-center text-mini leading-snug text-cac-muted">
            {t('conn.actionsSoon')}
          </p>
        </div>
      </div>
    </li>
  );
}

export function MyConnectionsPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { orgs, loading: loadingOrgs } = useMyOrganizations(accessToken);
  const [items, setItems] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const myOrgIds = useMemo(() => new Set(orgs.map((o) => o.id)), [orgs]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await connectionsApi.list(accessToken);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(id: string) {
    if (!accessToken) return;
    await connectionsApi.accept(accessToken, id);
    setMessage(t('conn.accepted'));
    await load();
  }

  async function decline(id: string) {
    if (!accessToken) return;
    await connectionsApi.decline(accessToken, id);
    setMessage(t('conn.declined'));
    await load();
  }

  async function close(id: string) {
    if (!accessToken) return;
    await connectionsApi.close(accessToken, id);
    setMessage(t('conn.closed'));
    await load();
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">
          {t('conn.listBadge')}
        </p>
        <h1 className="mt-2 text-grande font-bold text-cac-navy">{t('conn.listTitle')}</h1>
        <p className="mt-2 max-w-2xl text-pequena text-cac-muted">{t('conn.listDesc')}</p>
      </header>

      {message ? (
        <p className="rounded-xl border border-cac-green/30 bg-cac-green3/40 px-4 py-3 text-pequena font-semibold text-cac-navy">
          {message}
        </p>
      ) : null}

      {loading || loadingOrgs ? (
        <p className="rounded-2xl border border-cac-line bg-white p-5 text-media text-cac-muted shadow-cac">
          {t('dash.loading')}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <ConnectionRow
              key={item.id}
              item={item}
              myOrgIds={myOrgIds}
              onAccept={(id) => void accept(id)}
              onDecline={(id) => void decline(id)}
              onClose={(id) => void close(id)}
            />
          ))}
          {!items.length ? (
            <li className="rounded-2xl border border-dashed border-cac-line bg-white px-5 py-10 text-center text-media text-cac-muted">
              {t('conn.empty')}
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
