import {
  BannerPosition,
  orgBannerLinkUrlForKind,
  orgBannerPositionForKind,
  orgBannerUrlForKind,
  type BannerPosition as BannerPositionType,
  type OrgPublishKind,
} from '@cac/shared';

type OrgBanners = {
  technologyBannerUrl?: string | null;
  challengeBannerUrl?: string | null;
  fundingOfferBannerUrl?: string | null;
  successCaseBannerUrl?: string | null;
  technologyBannerLinkUrl?: string | null;
  challengeBannerLinkUrl?: string | null;
  fundingOfferBannerLinkUrl?: string | null;
  successCaseBannerLinkUrl?: string | null;
  technologyBannerPosition?: BannerPositionType | null;
  challengeBannerPosition?: BannerPositionType | null;
  fundingOfferBannerPosition?: BannerPositionType | null;
  successCaseBannerPosition?: BannerPositionType | null;
};

export type DetailBanner = {
  url: string | null;
  linkUrl: string | null;
  position: BannerPositionType;
};

/** Cascata: banner da publicação → banner da organização (por tipo) → null (skeleton). */
export function resolveDetailBanner(
  publication: {
    bannerImageUrl?: string | null;
    bannerLinkUrl?: string | null;
    bannerPosition?: BannerPositionType | string | null;
  } | null | undefined,
  organization: OrgBanners | null | undefined,
  kind: OrgPublishKind,
): DetailBanner {
  if (publication?.bannerImageUrl) {
    const pos = publication.bannerPosition;
    return {
      url: publication.bannerImageUrl,
      linkUrl: publication.bannerLinkUrl?.trim() || null,
      position:
        pos === BannerPosition.ABOVE_HERO ||
        pos === BannerPosition.BELOW_HERO ||
        pos === BannerPosition.ABOVE_FOOTER
          ? pos
          : BannerPosition.ABOVE_FOOTER,
    };
  }
  const orgUrl = orgBannerUrlForKind(organization, kind);
  if (orgUrl) {
    return {
      url: orgUrl,
      linkUrl: orgBannerLinkUrlForKind(organization, kind)?.trim() || null,
      position: orgBannerPositionForKind(organization, kind),
    };
  }
  return { url: null, linkUrl: null, position: BannerPosition.ABOVE_FOOTER };
}

/** @deprecated use resolveDetailBanner */
export function resolveDetailBannerUrl(
  publicationBannerUrl: string | null | undefined,
  organization: OrgBanners | null | undefined,
  kind: OrgPublishKind,
): string | null {
  return resolveDetailBanner({ bannerImageUrl: publicationBannerUrl }, organization, kind).url;
}
