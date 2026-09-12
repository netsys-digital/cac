import { orgBannerLinkUrlForKind, orgBannerUrlForKind, type OrgPublishKind } from '@cac/shared';

type OrgBanners = {
  technologyBannerUrl?: string | null;
  challengeBannerUrl?: string | null;
  fundingOfferBannerUrl?: string | null;
  successCaseBannerUrl?: string | null;
  technologyBannerLinkUrl?: string | null;
  challengeBannerLinkUrl?: string | null;
  fundingOfferBannerLinkUrl?: string | null;
  successCaseBannerLinkUrl?: string | null;
};

export type DetailBanner = {
  url: string | null;
  linkUrl: string | null;
};

/** Cascata: banner da publicação → banner da organização (por tipo) → null (skeleton). */
export function resolveDetailBanner(
  publication: { bannerImageUrl?: string | null; bannerLinkUrl?: string | null } | null | undefined,
  organization: OrgBanners | null | undefined,
  kind: OrgPublishKind,
): DetailBanner {
  if (publication?.bannerImageUrl) {
    return {
      url: publication.bannerImageUrl,
      linkUrl: publication.bannerLinkUrl?.trim() || null,
    };
  }
  const orgUrl = orgBannerUrlForKind(organization, kind);
  if (orgUrl) {
    return {
      url: orgUrl,
      linkUrl: orgBannerLinkUrlForKind(organization, kind)?.trim() || null,
    };
  }
  return { url: null, linkUrl: null };
}

/** @deprecated use resolveDetailBanner */
export function resolveDetailBannerUrl(
  publicationBannerUrl: string | null | undefined,
  organization: OrgBanners | null | undefined,
  kind: OrgPublishKind,
): string | null {
  return resolveDetailBanner({ bannerImageUrl: publicationBannerUrl }, organization, kind).url;
}
