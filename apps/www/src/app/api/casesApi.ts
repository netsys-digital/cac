import { urls } from '../../config';

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${urls.api}${path}`);
  if (!res.ok) throw new Error(`http_${res.status}`);
  return (await res.json()) as T;
}

export type SuccessCase = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  context?: string | null;
  outcomes?: string | null;
  country: string;
  region?: string | null;
  coverImageUrl?: string | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
    summary?: string | null;
    logoUrl?: string | null;
    verificationStatus?: string;
  };
  needs: Array<{ id: string; needType: string; detail?: string | null }>;
  media: Array<{
    id: string;
    filename: string;
    caption?: string | null;
    url: string;
    kind?: string;
    mimeType?: string;
  }>;
};

export const casesApi = {
  list: () => api<{ items: SuccessCase[] }>('/api/success-cases'),
  get: (slug: string) => api<{ successCase: SuccessCase }>(`/api/success-cases/${slug}`),
};
