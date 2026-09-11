import { urls } from '../../config';

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${urls.api}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `http_${res.status}`);
  }
  return (await res.json()) as T;
}

export type OrgSummary = {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  country?: string | null;
  region?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  verificationStatus: string;
};

export type TechnologyMedia = {
  id: string;
  url: string;
  kind: string;
  filename: string;
  mimeType: string;
};

export type Technology = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  problemStatement: string;
  howItWorks: string;
  videoUrl?: string | null;
  coverImageUrl?: string | null;
  status: string;
  country: string;
  region?: string | null;
  climateAction?: string | null;
  maturity?: string | null;
  tags: string[];
  media?: TechnologyMedia[];
  organization?: OrgSummary;
};

export type Challenge = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  context?: string | null;
  needType: string;
  coverImageUrl?: string | null;
  country?: string | null;
  region?: string | null;
  tags: string[];
  organization?: OrgSummary;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  type: string;
  summary: string;
  coverImageUrl?: string | null;
  country?: string | null;
  region?: string | null;
  organization?: OrgSummary;
};

export const catalogApi = {
  listTechnologies: () => api<{ items: Technology[] }>('/api/technologies'),
  getTechnology: (slug: string) => api<{ technology: Technology }>(`/api/technologies/${slug}`),
  listOrganizations: () => api<{ items: OrgSummary[] }>('/api/organizations'),
  getOrganization: (slug: string) =>
    api<{ organization: OrgSummary }>(`/api/organizations/${slug}`),
  listChallenges: () => api<{ items: Challenge[] }>('/api/challenges'),
  getChallenge: (slug: string) => api<{ challenge: Challenge }>(`/api/challenges/${slug}`),
  listProjects: () => api<{ items: Project[] }>('/api/projects'),
  getProject: (slug: string) => api<{ project: Project }>(`/api/projects/${slug}`),
};
