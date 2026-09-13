import { api } from './http';
import type { BannerPosition, OrgPublishKind } from '@cac/shared';

export type MyOrgMedia = {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  website?: string | null;
  verificationStatus: string;
  country?: string | null;
  region?: string | null;
  logoUrl?: string | null;
  publishKinds?: OrgPublishKind[];
  technologyBannerUrl?: string | null;
  challengeBannerUrl?: string | null;
  fundingOfferBannerUrl?: string | null;
  successCaseBannerUrl?: string | null;
  technologyBannerLinkUrl?: string | null;
  challengeBannerLinkUrl?: string | null;
  fundingOfferBannerLinkUrl?: string | null;
  successCaseBannerLinkUrl?: string | null;
  technologyBannerPosition?: BannerPosition | null;
  challengeBannerPosition?: BannerPosition | null;
  fundingOfferBannerPosition?: BannerPosition | null;
  successCaseBannerPosition?: BannerPosition | null;
};

export const orgApi = {
  listMine: (token: string) =>
    api<{ items: MyOrgMedia[] }>('/api/me/organizations', { accessToken: token }),

  updateMedia: (
    token: string,
    id: string,
    body: {
      technologyBannerLinkUrl?: string | null;
      challengeBannerLinkUrl?: string | null;
      fundingOfferBannerLinkUrl?: string | null;
      successCaseBannerLinkUrl?: string | null;
      technologyBannerPosition?: BannerPosition;
      challengeBannerPosition?: BannerPosition;
      fundingOfferBannerPosition?: BannerPosition;
      successCaseBannerPosition?: BannerPosition;
    },
  ) =>
    api<{ organization: MyOrgMedia }>(`/api/organizations/${id}/media`, {
      method: 'PATCH',
      accessToken: token,
      body: JSON.stringify(body),
    }),

  uploadLogo: (token: string, id: string, logo: File) => {
    const body = new FormData();
    body.append('logo', logo);
    return api<{ organization: MyOrgMedia }>(`/api/organizations/${id}/logo`, {
      method: 'POST',
      accessToken: token,
      body,
    });
  },

  uploadBanner: (token: string, id: string, kind: OrgPublishKind, banner: File) => {
    const body = new FormData();
    body.append('banner', banner);
    return api<{ organization: MyOrgMedia }>(`/api/organizations/${id}/banners/${kind}`, {
      method: 'POST',
      accessToken: token,
      body,
    });
  },
};
