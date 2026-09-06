import type { AuthUser } from '@cac/shared';
import { urls } from '../../config';

async function api<T>(
  path: string,
  options: RequestInit & { accessToken?: string | null } = {},
): Promise<T> {
  const { accessToken, headers, ...rest } = options;
  const res = await fetch(`${urls.api}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `http_${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type Organization = {
  id: string;
  name: string;
  slug: string;
  verificationStatus: string;
  country?: string | null;
  region?: string | null;
};

export type RepresentationRequest = {
  id: string;
  status: string;
  unit: string;
  linkRole: string;
  interest: string;
  organizationId: string;
  organization?: Organization;
  user?: Pick<AuthUser, 'id' | 'email' | 'name'>;
};

export const catalogApi = {
  listOrganizations: (token: string) =>
    api<{ items: Organization[] }>('/api/organizations', { accessToken: token }),
  createOrganization: (token: string, body: Record<string, unknown>) =>
    api<{ organization: Organization }>('/api/organizations', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  createRepresentation: (token: string, orgId: string, body: Record<string, unknown>) =>
    api<{ request: RepresentationRequest }>(`/api/organizations/${orgId}/representation-requests`, {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  myRepresentations: (token: string) =>
    api<{ items: RepresentationRequest[] }>('/api/me/representation-requests', { accessToken: token }),
  adminRepresentations: (token: string) =>
    api<{ items: RepresentationRequest[] }>('/api/admin/representation-requests?status=REQUESTED', {
      accessToken: token,
    }),
  approveRepresentation: (token: string, id: string) =>
    api<{ request: RepresentationRequest }>(`/api/admin/representation-requests/${id}/approve`, {
      method: 'POST',
      accessToken: token,
    }),
  rejectRepresentation: (token: string, id: string) =>
    api<{ request: RepresentationRequest }>(`/api/admin/representation-requests/${id}/reject`, {
      method: 'POST',
      accessToken: token,
    }),
  verifyOrganization: (token: string, id: string) =>
    api<{ organization: Organization }>(`/api/admin/organizations/${id}/verify`, {
      method: 'POST',
      accessToken: token,
    }),
  listDomains: (grouping: string) => api<{ items: Array<{ id: string; key: string; labelPt: string; labelEn: string; sortOrder: number }> }>(`/api/domains/${grouping}`),
  createDomain: (token: string, body: Record<string, unknown>) =>
    api<{ domain: { id: string } }>('/api/admin/domains', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  deleteDomain: (token: string, id: string) =>
    api<void>(`/api/admin/domains/${id}`, { method: 'DELETE', accessToken: token }),
  createTechnology: (token: string, body: Record<string, unknown>) =>
    api<{ technology: { id: string; status: string; slug: string } }>('/api/technologies', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  submitTechnology: (token: string, id: string) =>
    api<{ technology: { id: string; status: string } }>(`/api/technologies/${id}/submit`, {
      method: 'POST',
      accessToken: token,
    }),
  createChallenge: (token: string, body: Record<string, unknown>) =>
    api<{ challenge: { id: string; status: string } }>('/api/challenges', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  submitChallenge: (token: string, id: string) =>
    api<{ challenge: { id: string; status: string } }>(`/api/challenges/${id}/submit`, {
      method: 'POST',
      accessToken: token,
    }),
};
