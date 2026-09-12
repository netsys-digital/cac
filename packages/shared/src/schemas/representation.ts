import { z } from 'zod';
import { OrgPublishKind, RepresentationStatus } from '../enums.js';

export const createRepresentationBodySchema = z.object({
  unit: z.string().min(2).max(200),
  linkRole: z.string().min(2).max(120),
  interest: z.string().min(10).max(2000),
});

export const approveRepresentationBodySchema = z.object({
  publishKinds: z
    .array(
      z.enum([
        OrgPublishKind.TECHNOLOGY,
        OrgPublishKind.CHALLENGE,
        OrgPublishKind.FUNDING_OFFER,
        OrgPublishKind.SUCCESS_CASE,
      ]),
    )
    .min(1)
    .max(4),
});

export const updateOrganizationAdminBodySchema = z.object({
  name: z.string().min(2).max(200).optional(),
  summary: z.string().min(10).max(2000).optional().nullable(),
  country: z.string().length(2).optional().nullable(),
  region: z.string().min(2).max(64).optional().nullable(),
  website: z.string().url().optional().or(z.literal('')).nullable(),
  technologyBannerLinkUrl: z.string().url().optional().or(z.literal('')).nullable(),
  challengeBannerLinkUrl: z.string().url().optional().or(z.literal('')).nullable(),
  fundingOfferBannerLinkUrl: z.string().url().optional().or(z.literal('')).nullable(),
  successCaseBannerLinkUrl: z.string().url().optional().or(z.literal('')).nullable(),
  publishKinds: z
    .array(
      z.enum([
        OrgPublishKind.TECHNOLOGY,
        OrgPublishKind.CHALLENGE,
        OrgPublishKind.FUNDING_OFFER,
        OrgPublishKind.SUCCESS_CASE,
      ]),
    )
    .min(0)
    .max(4)
    .optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
});

export const representationRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  unit: z.string(),
  linkRole: z.string(),
  interest: z.string(),
  proofDocument1Url: z.string().min(1),
  proofDocument2Url: z.string().nullable().optional(),
  status: z.enum([
    RepresentationStatus.REQUESTED,
    RepresentationStatus.UNDER_REVIEW,
    RepresentationStatus.APPROVED,
    RepresentationStatus.REJECTED,
  ]),
});

export type CreateRepresentationBody = z.infer<typeof createRepresentationBodySchema>;
export type ApproveRepresentationBody = z.infer<typeof approveRepresentationBodySchema>;
export type UpdateOrganizationAdminBody = z.infer<typeof updateOrganizationAdminBodySchema>;
