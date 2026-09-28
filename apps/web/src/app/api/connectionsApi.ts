import { api } from './http';

export type Connection = {
  id: string;
  status: string;
  objective: string;
  targetType: string;
  targetId: string;
  message?: string | null;
  expiresAt: string;
  requesterOrgId: string;
  targetOrgId: string;
  requesterUserId: string;
  requesterOrg?: { id: string; name: string; slug: string; logoUrl?: string | null };
  targetOrg?: { id: string; name: string; slug: string; logoUrl?: string | null };
  requesterUser?: { id: string; name: string; email: string };
  requesterRole?: { unit: string; linkRole: string } | null;
  declineReason?: string | null;
  /** Afiliado real da org destino (staff não conta). */
  viewerCanAcceptDecline?: boolean;
  viewerCanClose?: boolean;
};

export type PendingItem = {
  kind: string;
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  country?: string | null;
  region?: string | null;
  status?: string;
  curationNote?: string | null;
  organization?: { id: string; name: string };
  updatedAt: string;
};

export type DeletionRequestItem = {
  id: string;
  kind: string;
  targetId: string;
  targetTitle: string;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  contentStatus: string | null;
  organization: { id: string; name: string; slug: string };
  requester: { id: string; name: string; email: string };
  reviewer?: { id: string; name: string } | null;
};

export type SavedItemTarget = {
  title: string;
  slug: string | null;
  summary: string | null;
  coverImageUrl: string | null;
  organizationName: string | null;
  portalPath: string | null;
};

export type SavedItem = {
  id: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  target: SavedItemTarget | null;
};

export const connectionsApi = {
  list: (token: string) => api<{ items: Connection[] }>('/api/connections', { accessToken: token }),
  create: (token: string, body: Record<string, unknown>) =>
    api<{ connection: Connection }>('/api/connections', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  accept: (token: string, id: string) =>
    api<{ connection: Connection }>(`/api/connections/${id}/accept`, {
      method: 'PATCH',
      accessToken: token,
    }),
  decline: (token: string, id: string, reason: string) =>
    api<{ connection: Connection }>(`/api/connections/${id}/decline`, {
      method: 'PATCH',
      accessToken: token,
      body: JSON.stringify({ reason }),
    }),
  close: (token: string, id: string) =>
    api<{ connection: Connection }>(`/api/connections/${id}/close`, {
      method: 'PATCH',
      accessToken: token,
    }),
  saveItem: (token: string, body: { targetType: string; targetId: string }) =>
    api<{ item: unknown }>('/api/saved-items', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  listSaved: (token: string) =>
    api<{ items: SavedItem[] }>('/api/saved-items', { accessToken: token }),
  unsaveItem: (token: string, id: string) =>
    api<void>(`/api/saved-items/${id}`, { method: 'DELETE', accessToken: token }),
  follow: (token: string, organizationId: string) =>
    api<{ item: unknown }>('/api/follows', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify({ organizationId }),
    }),
  listFollows: (token: string) =>
    api<{ items: Array<{ id: string; organization?: { name: string; slug: string } }> }>('/api/follows', {
      accessToken: token,
    }),
  adminPending: (token: string, status?: 'ALL' | 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED') =>
    api<{ items: PendingItem[] }>(
      `/api/admin/pending${status ? `?status=${status}` : ''}`,
      { accessToken: token },
    ),
  adminDeleteContent: (token: string, kind: string, id: string) =>
    api<void>(`/api/admin/contents/${kind}/${id}`, { method: 'DELETE', accessToken: token }),
  adminDeletionRequests: (token: string) =>
    api<{ items: DeletionRequestItem[] }>('/api/admin/deletion-requests', { accessToken: token }),
  approveDeletionRequest: (token: string, id: string, note?: string) =>
    api<{ item: unknown }>(`/api/admin/deletion-requests/${id}/approve`, {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify({ note: note ?? '' }),
    }),
  rejectDeletionRequest: (token: string, id: string, note: string) =>
    api<{ item: unknown }>(`/api/admin/deletion-requests/${id}/reject`, {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify({ note }),
    }),
  publishPending: (token: string, kind: string, id: string, note?: string) =>
    api<{ item: unknown }>(`/api/admin/pending/${kind}/${id}/publish`, {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify({ note: note ?? '' }),
    }),
  returnPending: (token: string, kind: string, id: string, note: string) =>
    api<{ item: unknown }>(`/api/admin/pending/${kind}/${id}/return`, {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify({ note }),
    }),
  rejectPending: (token: string, kind: string, id: string, note: string) =>
    api<{ item: unknown }>(`/api/admin/pending/${kind}/${id}/reject`, {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify({ note }),
    }),
  kpis: (token: string) =>
    api<{ kpis: Record<string, number> }>('/api/admin/kpis', { accessToken: token }),
};
