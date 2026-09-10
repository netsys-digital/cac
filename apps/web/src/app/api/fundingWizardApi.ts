import { api } from './http';

export const fundingWizardApi = {
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
