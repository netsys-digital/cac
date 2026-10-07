import { urls } from '../../config';
import { withLang } from './withLang';

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${urls.api}${withLang(path)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `http_${res.status}`);
  }
  return (await res.json()) as T;
}

/** Card de chamada configurado na publicação (vazio = usa título/resumo/capa). */
export type CallCardFields = {
  cardImageUrl?: string | null;
  cardTitle?: string | null;
  cardSummary?: string | null;
};

export type HighlightType = 'SOLUTION' | 'FUNDING_OFFER' | 'SUCCESS_CASE';

export type HighlightItem = CallCardFields & {
  type: HighlightType;
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImageUrl?: string | null;
  organizationName?: string | null;
};

export type OrgSummary = {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  country?: string | null;
  region?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  technologyBannerUrl?: string | null;
  challengeBannerUrl?: string | null;
  fundingOfferBannerUrl?: string | null;
  successCaseBannerUrl?: string | null;
  technologyBannerLinkUrl?: string | null;
  challengeBannerLinkUrl?: string | null;
  fundingOfferBannerLinkUrl?: string | null;
  successCaseBannerLinkUrl?: string | null;
  technologyBannerPosition?: 'ABOVE_HERO' | 'BELOW_HERO' | 'ABOVE_FOOTER' | null;
  challengeBannerPosition?: 'ABOVE_HERO' | 'BELOW_HERO' | 'ABOVE_FOOTER' | null;
  fundingOfferBannerPosition?: 'ABOVE_HERO' | 'BELOW_HERO' | 'ABOVE_FOOTER' | null;
  successCaseBannerPosition?: 'ABOVE_HERO' | 'BELOW_HERO' | 'ABOVE_FOOTER' | null;
  verificationStatus: string;
};

export type TechnologyMedia = {
  id: string;
  url: string;
  kind: string;
  filename: string;
  mimeType: string;
};

export type Technology = CallCardFields & {
  id: string;
  title: string;
  slug: string;
  summary: string;
  problemStatement: string;
  howItWorks: string;
  videoUrl?: string | null;
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  bannerLinkUrl?: string | null;
  bannerPosition?: 'ABOVE_HERO' | 'BELOW_HERO' | 'ABOVE_FOOTER' | null;
  status: string;
  country: string;
  region?: string | null;
  climateAction?: string | null;
  maturity?: string | null;
  developedWithPartners?: boolean | null;
  partnerInstitutions?: string | null;
  methodology?: string | null;
  launchYear?: number | null;
  state?: string | null;
  biome?: string | null;
  responsibleUnit?: string | null;
  accessInfo?: string | null;
  keywords?: string[];
  officialUrl?: string | null;
  tags: string[];
  media?: TechnologyMedia[];
  organization?: OrgSummary;
};

export type Challenge = CallCardFields & {
  id: string;
  title: string;
  slug: string;
  summary: string;
  context?: string | null;
  needType: string;
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  bannerLinkUrl?: string | null;
  bannerPosition?: 'ABOVE_HERO' | 'BELOW_HERO' | 'ABOVE_FOOTER' | null;
  country?: string | null;
  region?: string | null;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
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
  listHighlights: () =>
    api<{ mode: 'curated' | 'auto'; items: HighlightItem[] }>('/api/highlights'),
  listAttachments: (kind: AttachmentTarget, id: string) =>
    api<{ gallery: Attachment[]; documents: Attachment[] }>(`/api/${kind}/${id}/attachments`),
};

export type AttachmentTarget = 'technologies' | 'challenges' | 'funding-offers' | 'success-cases';

export type Attachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  title?: string | null;
  description?: string | null;
};
