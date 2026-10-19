import { api } from './http';

export type MyFunder = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  website?: string | null;
  logoUrl?: string | null;
  interestAreas?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  country?: string | null;
  region?: string | null;
  organizationId?: string | null;
  status: string;
  curationNote?: string | null;
};

export const fundingWizardApi = {
  myFunders: (token: string) =>
    api<{ items: MyFunder[] }>('/api/funders/mine', { accessToken: token }),
  createFunder: (token: string, body: Record<string, unknown>) =>
    api<{ funder: MyFunder }>('/api/funders', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  updateFunder: (token: string, id: string, body: Record<string, unknown>) =>
    api<{ funder: MyFunder }>(`/api/funders/${id}`, {
      method: 'PATCH',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  submitFunder: (token: string, id: string) =>
    api<{ funder: MyFunder }>(`/api/funders/${id}/submit`, {
      method: 'POST',
      accessToken: token,
    }),
  uploadLogo: (token: string, id: string, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return api<{ logoUrl: string }>(`/api/funders/${id}/logo`, {
      method: 'POST',
      accessToken: token,
      body,
    });
  },
  createOffer: (token: string, body: Record<string, unknown>) =>
    api<{ offer: { id: string; slug: string } }>('/api/funding-offers', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  submitOffer: (token: string, id: string) =>
    api<{ offer: { id: string } }>(`/api/funding-offers/${id}/submit`, {
      method: 'POST',
      accessToken: token,
    }),
  createCase: (token: string, body: Record<string, unknown>) =>
    api<{ successCase: { id: string; slug: string } }>('/api/success-cases', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  submitCase: (token: string, id: string) =>
    api<{ successCase: { id: string } }>(`/api/success-cases/${id}/submit`, {
      method: 'POST',
      accessToken: token,
    }),
};
