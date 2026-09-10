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
  decline: (token: string, id: string) =>
    api<{ connection: Connection }>(`/api/connections/${id}/decline`, {
      method: 'PATCH',
      accessToken: token,
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
  listSaved: (token: string) => api<{ items: Array<{ id: string; targetType: string; targetId: string }> }>('/api/saved-items', { accessToken: token }),
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
  adminPending: (token: string) =>
    api<{ items: PendingItem[] }>('/api/admin/pending', { accessToken: token }),
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
