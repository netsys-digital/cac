import type { AuthUser } from '@cac/shared';
import { api } from './http';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  verificationStatus: string;
  country?: string | null;
  region?: string | null;
  logoUrl?: string | null;
  publishKinds?: Array<'TECHNOLOGY' | 'CHALLENGE' | 'FUNDING_OFFER' | 'SUCCESS_CASE'>;
};

export type AdminOrganization = Organization & {
  summary?: string | null;
  website?: string | null;
  _count?: {
    members: number;
    technologies: number;
    challenges: number;
    fundingOffers: number;
    successCases: number;
  };
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    user?: Pick<AuthUser, 'id' | 'email' | 'name'>;
  }>;
  representationRequests?: Array<{
    id: string;
    status: string;
    unit: string;
    linkRole: string;
    interest?: string | null;
    userId: string;
    user?: Pick<AuthUser, 'id' | 'email' | 'name'>;
  }>;
};

export type RepresentationRequest = {
  id: string;
  status: string;
  unit: string;
  linkRole: string;
  interest: string;
  proofDocument1Url?: string;
  proofDocument2Url?: string | null;
  organizationId: string;
  organization?: Organization;
  user?: Pick<AuthUser, 'id' | 'email' | 'name'>;
};

/** Vínculo unificado (representação e/ou membership) na aba da organização. */
export type OrganizationLink = {
  id: string;
  source: 'REPRESENTATION' | 'MEMBER';
  representationId?: string | null;
  memberId?: string | null;
  status: string;
  unit?: string | null;
  linkRole?: string | null;
  interest?: string | null;
  createdAt?: string;
  user?: Pick<AuthUser, 'id' | 'email' | 'name'>;
};

export const catalogApi = {
  listOrganizations: (token: string) =>
    api<{ items: Organization[] }>('/api/organizations', { accessToken: token }),
  createOrganization: (
    token: string,
    body: {
      name: string;
      summary: string;
      country: string;
      region: string;
      website?: string;
      logo: File;
    },
  ) => {
    const form = new FormData();
    form.append('name', body.name);
    form.append('summary', body.summary);
    form.append('country', body.country);
    form.append('region', body.region);
    if (body.website) form.append('website', body.website);
    form.append('logo', body.logo);
    return api<{ organization: Organization }>('/api/organizations', {
      method: 'POST',
      accessToken: token,
      body: form,
    });
  },
  createRepresentation: (
    token: string,
    orgId: string,
    body: {
      unit: string;
      linkRole: string;
      interest: string;
      proofDocument1: File;
      proofDocument2?: File | null;
    },
  ) => {
    const form = new FormData();
    form.append('unit', body.unit);
    form.append('linkRole', body.linkRole);
    form.append('interest', body.interest);
    form.append('proofDocument1', body.proofDocument1);
    if (body.proofDocument2) form.append('proofDocument2', body.proofDocument2);
    return api<{ request: RepresentationRequest }>(
      `/api/organizations/${orgId}/representation-requests`,
      {
        method: 'POST',
        accessToken: token,
        body: form,
      },
    );
  },
  myRepresentations: (token: string) =>
    api<{ items: RepresentationRequest[] }>('/api/me/representation-requests', { accessToken: token }),
  adminRepresentations: (token: string) =>
    api<{ items: RepresentationRequest[] }>('/api/admin/representation-requests?status=REQUESTED', {
      accessToken: token,
    }),
  approveRepresentation: (
    token: string,
    id: string,
    body: { publishKinds: Array<'TECHNOLOGY' | 'CHALLENGE' | 'FUNDING_OFFER' | 'SUCCESS_CASE'> },
  ) =>
    api<{ request: RepresentationRequest }>(`/api/admin/representation-requests/${id}/approve`, {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  rejectRepresentation: (token: string, id: string) =>
    api<{ request: RepresentationRequest }>(`/api/admin/representation-requests/${id}/reject`, {
      method: 'POST',
      accessToken: token,
    }),
  adminOrganizations: (token: string) =>
    api<{ items: AdminOrganization[] }>('/api/admin/organizations', { accessToken: token }),
  updateOrganization: (
    token: string,
    id: string,
    body: {
      name?: string;
      summary?: string | null;
      country?: string | null;
      region?: string | null;
      website?: string | null;
      publishKinds?: Array<'TECHNOLOGY' | 'CHALLENGE' | 'FUNDING_OFFER' | 'SUCCESS_CASE'>;
      verificationStatus?: string;
    },
  ) =>
    api<{ organization: Organization }>(`/api/admin/organizations/${id}`, {
      method: 'PATCH',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  uploadOrganizationLogo: (token: string, id: string, logo: File) => {
    const body = new FormData();
    body.append('logo', logo);
    return api<{ organization: Organization }>(`/api/admin/organizations/${id}/logo`, {
      method: 'POST',
      accessToken: token,
      body,
    });
  },
  verifyOrganization: (token: string, id: string) =>
    api<{ organization: Organization }>(`/api/admin/organizations/${id}/verify`, {
      method: 'POST',
      accessToken: token,
    }),
  organizationRepresentations: (token: string, orgId: string) =>
    api<{ items: OrganizationLink[] }>(`/api/admin/organizations/${orgId}/representation-requests`, {
      accessToken: token,
    }),
  deleteRepresentation: (token: string, id: string) =>
    api<void>(`/api/admin/representation-requests/${id}`, {
      method: 'DELETE',
      accessToken: token,
    }),
  deleteOrganizationMember: (token: string, orgId: string, memberId: string) =>
    api<void>(`/api/admin/organizations/${orgId}/members/${memberId}`, {
      method: 'DELETE',
      accessToken: token,
    }),
  listDomains: (grouping: string) => api<{ items: Array<{ id: string; key: string; labelPt: string; labelEn: string; sortOrder: number }> }>(`/api/domains/${grouping}`),
  createDomain: (token: string, body: Record<string, unknown>) =>
    api<{ domain: { id: string } }>('/api/admin/domains', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  updateDomain: (token: string, id: string, body: Record<string, unknown>) =>
    api<{ domain: { id: string } }>(`/api/admin/domains/${id}`, {
      method: 'PATCH',
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
  uploadCover: (
    token: string,
    kind: 'technologies' | 'challenges' | 'funding-offers' | 'success-cases' | 'projects',
    id: string,
    file: File,
  ) => {
    const body = new FormData();
    body.append('file', file);
    return api<{ coverImageUrl: string }>(`/api/${kind}/${id}/cover`, {
      method: 'POST',
      accessToken: token,
      body,
    });
  },
};
