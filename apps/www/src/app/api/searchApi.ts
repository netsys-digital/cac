import { urls } from '../../config';

export type SearchFilters = {
  country?: string;
  region?: string;
  theme?: string;
  actorType?: string;
  sector?: string;
  maturity?: string;
  scale?: string;
  financing?: 'WITH_OPPORTUNITY' | 'ALL';
  contentType?: string;
};

export type ScoreFactor = { label: string; weight: number; value: number };

export type SearchResult = {
  id: string;
  slug: string;
  contentType: string;
  title: string;
  summary: string;
  tags: string[];
  score: number;
  factors: ScoreFactor[];
  href: string;
  country?: string | null;
  region?: string | null;
  organizationName?: string | null;
};

export type SearchResponse = {
  interpretation: { challenge: string; context: string; sector: string; intent: string };
  total: number;
  facets: { solutions: number; projects: number; organizations: number; funders: number; cases?: number; challenges?: number };
  results: SearchResult[];
  paths: {
    whoCanSolve: Array<{ organizationId: string; name: string; score: number; slug?: string }>;
    whoCanFund: Array<{
      id: string;
      kind: 'ACTIVE_OFFER' | 'DIRECTORY';
      name: string;
      score: number;
      slug?: string;
    }>;
    relatedProjects: Array<{ id: string; type: string; title: string; score: number; slug?: string }>;
  };
  meta: { minScore: number; mode: string; provider: string };
};

export async function postSearch(body: {
  query: string;
  filters?: SearchFilters;
  lang?: 'pt' | 'en';
}): Promise<SearchResponse> {
  const res = await fetch(`${urls.api}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `http_${res.status}`);
  }
  return (await res.json()) as SearchResponse;
}
