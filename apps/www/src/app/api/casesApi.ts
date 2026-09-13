import { urls } from '../../config';
import { withLang } from './withLang';

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${urls.api}${withLang(path)}`);
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
  bannerImageUrl?: string | null;
  bannerLinkUrl?: string | null;
  bannerPosition?: 'ABOVE_HERO' | 'BELOW_HERO' | 'ABOVE_FOOTER' | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
    summary?: string | null;
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
