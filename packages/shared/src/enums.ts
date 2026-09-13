export const UserRole = {
  ADMIN: 'ADMIN',
  CURADOR: 'CURADOR',
  ORG_ADMIN: 'ORG_ADMIN',
  ORG_MEMBER: 'ORG_MEMBER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const OrgVerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type OrgVerificationStatus =
  (typeof OrgVerificationStatus)[keyof typeof OrgVerificationStatus];

export const OrgPublishKind = {
  TECHNOLOGY: 'TECHNOLOGY',
  CHALLENGE: 'CHALLENGE',
  FUNDING_OFFER: 'FUNDING_OFFER',
  SUCCESS_CASE: 'SUCCESS_CASE',
} as const;
export type OrgPublishKind = (typeof OrgPublishKind)[keyof typeof OrgPublishKind];

export const ORG_PUBLISH_KINDS = [
  OrgPublishKind.TECHNOLOGY,
  OrgPublishKind.CHALLENGE,
  OrgPublishKind.FUNDING_OFFER,
  OrgPublishKind.SUCCESS_CASE,
] as const;

/** Prisma field on Organization for the default banner of each publish kind. */
export const ORG_BANNER_FIELD = {
  TECHNOLOGY: 'technologyBannerUrl',
  CHALLENGE: 'challengeBannerUrl',
  FUNDING_OFFER: 'fundingOfferBannerUrl',
  SUCCESS_CASE: 'successCaseBannerUrl',
} as const satisfies Record<OrgPublishKind, string>;

export type OrgBannerField = (typeof ORG_BANNER_FIELD)[OrgPublishKind];

/** Prisma field on Organization for the click-through URL of each banner. */
export const ORG_BANNER_LINK_FIELD = {
  TECHNOLOGY: 'technologyBannerLinkUrl',
  CHALLENGE: 'challengeBannerLinkUrl',
  FUNDING_OFFER: 'fundingOfferBannerLinkUrl',
  SUCCESS_CASE: 'successCaseBannerLinkUrl',
} as const satisfies Record<OrgPublishKind, string>;

export type OrgBannerLinkField = (typeof ORG_BANNER_LINK_FIELD)[OrgPublishKind];

/** Where the promotional banner appears on the public detail page. */
export const BannerPosition = {
  ABOVE_HERO: 'ABOVE_HERO',
  BELOW_HERO: 'BELOW_HERO',
  ABOVE_FOOTER: 'ABOVE_FOOTER',
} as const;
export type BannerPosition = (typeof BannerPosition)[keyof typeof BannerPosition];

export const BANNER_POSITIONS = [
  BannerPosition.ABOVE_HERO,
  BannerPosition.BELOW_HERO,
  BannerPosition.ABOVE_FOOTER,
] as const;

/** Prisma field on Organization for the default banner position of each publish kind. */
export const ORG_BANNER_POSITION_FIELD = {
  TECHNOLOGY: 'technologyBannerPosition',
  CHALLENGE: 'challengeBannerPosition',
  FUNDING_OFFER: 'fundingOfferBannerPosition',
  SUCCESS_CASE: 'successCaseBannerPosition',
} as const satisfies Record<OrgPublishKind, string>;

export type OrgBannerPositionField = (typeof ORG_BANNER_POSITION_FIELD)[OrgPublishKind];

export function orgBannerUrlForKind(
  org: Partial<Record<OrgBannerField, string | null | undefined>> | null | undefined,
  kind: OrgPublishKind,
): string | null {
  if (!org) return null;
  const value = org[ORG_BANNER_FIELD[kind]];
  return value ?? null;
}

export function orgBannerLinkUrlForKind(
  org: Partial<Record<OrgBannerLinkField, string | null | undefined>> | null | undefined,
  kind: OrgPublishKind,
): string | null {
  if (!org) return null;
  const value = org[ORG_BANNER_LINK_FIELD[kind]];
  return value ?? null;
}

export function orgBannerPositionForKind(
  org: Partial<Record<OrgBannerPositionField, BannerPosition | null | undefined>> | null | undefined,
  kind: OrgPublishKind,
): BannerPosition {
  if (!org) return BannerPosition.ABOVE_FOOTER;
  const value = org[ORG_BANNER_POSITION_FIELD[kind]];
  return value ?? BannerPosition.ABOVE_FOOTER;
}

export const ContentStatus = {
  DRAFT: 'DRAFT',
  IN_REVIEW: 'IN_REVIEW',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];

export const RepresentationStatus = {
  REQUESTED: 'REQUESTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type RepresentationStatus =
  (typeof RepresentationStatus)[keyof typeof RepresentationStatus];

export const ClimateAction = {
  ADAPTATION: 'ADAPTATION',
  MITIGATION: 'MITIGATION',
  BOTH: 'BOTH',
} as const;
export type ClimateAction = (typeof ClimateAction)[keyof typeof ClimateAction];

export const ProjectType = {
  PROJECT: 'PROJECT',
  INITIATIVE: 'INITIATIVE',
  POLICY: 'POLICY',
  PROGRAMME: 'PROGRAMME',
} as const;
export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const NeedType = {
  TECHNOLOGY: 'TECHNOLOGY',
  KNOWLEDGE: 'KNOWLEDGE',
  PARTNERSHIP: 'PARTNERSHIP',
  FUNDING: 'FUNDING',
  TRAINING: 'TRAINING',
  RESEARCH: 'RESEARCH',
  EQUIPMENT: 'EQUIPMENT',
} as const;
export type NeedType = (typeof NeedType)[keyof typeof NeedType];

export const Maturity = {
  RESEARCH: 'RESEARCH',
  VALIDATION: 'VALIDATION',
  DEMONSTRATION: 'DEMONSTRATION',
  READY_FOR_IMPLEMENTATION: 'READY_FOR_IMPLEMENTATION',
  AT_SCALE: 'AT_SCALE',
} as const;
export type Maturity = (typeof Maturity)[keyof typeof Maturity];

export const MediaKind = {
  IMAGE: 'IMAGE',
  PDF: 'PDF',
} as const;
export type MediaKind = (typeof MediaKind)[keyof typeof MediaKind];

export const ConnectionObjective = {
  KNOW_MORE: 'KNOW_MORE',
  IMPLEMENT_SOLUTION: 'IMPLEMENT_SOLUTION',
  PARTNERSHIP: 'PARTNERSHIP',
  FUNDING: 'FUNDING',
} as const;
export type ConnectionObjective = (typeof ConnectionObjective)[keyof typeof ConnectionObjective];

export const ConnectionTargetType = {
  TECHNOLOGY: 'TECHNOLOGY',
  PROJECT: 'PROJECT',
  FUNDING_OFFER: 'FUNDING_OFFER',
  SUCCESS_CASE: 'SUCCESS_CASE',
  CHALLENGE: 'CHALLENGE',
  ORGANIZATION: 'ORGANIZATION',
} as const;
export type ConnectionTargetType = (typeof ConnectionTargetType)[keyof typeof ConnectionTargetType];

export const ConnectionStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  CONTACT_SHARED: 'CONTACT_SHARED',
  CLOSED: 'CLOSED',
} as const;
export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

export const MATCH_MIN_SCORE_DEFAULT = 5;
export const CONNECTION_EXPIRY_DAYS_DEFAULT = 15;
