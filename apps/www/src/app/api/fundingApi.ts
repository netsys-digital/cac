import { urls } from '../../config';
import { withLang } from './withLang';

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${urls.api}${withLang(path)}`);
  if (!res.ok) throw new Error(`http_${res.status}`);
  return (await res.json()) as T;
}

export type FundingOffer = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  whatFunds?: string | null;
  criteria?: string | null;
  amountRange?: string | null;
  officialUrl?: string | null;
  deadline?: string | null;
  country?: string | null;
  region?: string | null;
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  bannerLinkUrl?: string | null;
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
    verificationStatus?: string;
  };
};

export type FunderProfile = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  country?: string | null;
  region?: string | null;
};

export const fundingApi = {
  listOffers: (active = true) =>
    api<{ items: FundingOffer[] }>(`/api/funding-offers${active ? '?active=true' : ''}`),
  getOffer: (slug: string) => api<{ offer: FundingOffer }>(`/api/funding-offers/${slug}`),
  listFunders: () => api<{ items: FunderProfile[] }>('/api/funders'),
};
