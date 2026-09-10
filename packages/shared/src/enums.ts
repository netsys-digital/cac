export const UserRole = {
  ADMIN: 'ADMIN',
  CURADOR: 'CURADOR',
  ORG_ADMIN: 'ORG_ADMIN',
  ORG_MEMBER: 'ORG_MEMBER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

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
