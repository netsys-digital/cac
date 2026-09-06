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
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `http_${res.status}`);
  }
  return (await res.json()) as T;
}

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
