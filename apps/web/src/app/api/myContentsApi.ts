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
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
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

export type ContentKind = 'TECHNOLOGY' | 'CHALLENGE' | 'FUNDING_OFFER' | 'SUCCESS_CASE';

export type MyContentItem = {
  kind: ContentKind;
  id: string;
  title: string;
  slug: string;
  status: string;
  country: string;
  organizationId: string;
  organizationName: string;
  updatedAt: string;
  editPath: string;
};

export type DashboardStats = {
  published: number;
  drafts: number;
  inReview: number;
  connections: number;
  connectionsPending: number;
  contacts: number;
  favorites: number;
  follows: number;
  interactions: number;
  views: number;
  viewsTracked: boolean;
  likesReceived: number;
};

export type DashboardResponse = {
  stats: DashboardStats;
  breakdown: {
    technologies: number;
    challenges: number;
    offers: number;
    cases: number;
  };
};

export const myContentsApi = {
  dashboard: (token: string) =>
    api<DashboardResponse>('/api/me/dashboard', { accessToken: token }),
  list: (token: string, query?: { kind?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (query?.kind) qs.set('kind', query.kind);
    if (query?.status) qs.set('status', query.status);
    const suffix = qs.toString() ? `?${qs}` : '';
    return api<{ items: MyContentItem[] }>(`/api/me/contents${suffix}`, { accessToken: token });
  },
  get: (token: string, kind: ContentKind, id: string) =>
    api<{ item: Record<string, unknown> }>(`/api/me/contents/${kind}/${id}`, { accessToken: token }),
  withdraw: (token: string, kind: ContentKind, id: string) =>
    api<{ item: Record<string, unknown> }>(`/api/me/contents/${kind}/${id}/withdraw`, {
      method: 'POST',
      accessToken: token,
    }),
  remove: (token: string, kind: ContentKind, id: string) =>
    api<void>(`/api/me/contents/${kind}/${id}`, { method: 'DELETE', accessToken: token }),
  patchTechnology: (token: string, id: string, body: Record<string, unknown>) =>
    api<{ technology: { id: string; status: string; slug: string } }>(`/api/technologies/${id}`, {
      method: 'PATCH',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  patchChallenge: (token: string, id: string, body: Record<string, unknown>) =>
    api<{ challenge: { id: string; status: string } }>(`/api/challenges/${id}`, {
      method: 'PATCH',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  patchOffer: (token: string, id: string, body: Record<string, unknown>) =>
    api<{ offer: { id: string; status: string; slug: string } }>(`/api/funding-offers/${id}`, {
      method: 'PATCH',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  patchCase: (token: string, id: string, body: Record<string, unknown>) =>
    api<{ successCase: { id: string; status: string; slug: string } }>(`/api/success-cases/${id}`, {
      method: 'PATCH',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  submitTechnology: (token: string, id: string) =>
    api(`/api/technologies/${id}/submit`, { method: 'POST', accessToken: token }),
  submitChallenge: (token: string, id: string) =>
    api(`/api/challenges/${id}/submit`, { method: 'POST', accessToken: token }),
  submitOffer: (token: string, id: string) =>
    api(`/api/funding-offers/${id}/submit`, { method: 'POST', accessToken: token }),
  submitCase: (token: string, id: string) =>
    api(`/api/success-cases/${id}/submit`, { method: 'POST', accessToken: token }),
};
