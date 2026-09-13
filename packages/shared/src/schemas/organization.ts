import { z } from 'zod';
import { BannerPosition, OrgVerificationStatus } from '../enums.js';

export const createOrganizationBodySchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  summary: z.string().min(10).max(2000),
  country: z.string().length(2),
  region: z.string().min(2).max(64),
  website: z.string().url().optional().or(z.literal('')),
});

export const updateOrganizationBodySchema = createOrganizationBodySchema.partial();

const orgBannerPositionSchema = z
  .enum([BannerPosition.ABOVE_HERO, BannerPosition.BELOW_HERO, BannerPosition.ABOVE_FOOTER])
  .optional();

/** Member/affiliate can update org media metadata (links + positions). */
export const updateOrganizationMediaBodySchema = z.object({
  technologyBannerLinkUrl: z.string().url().optional().or(z.literal('')).nullable(),
  challengeBannerLinkUrl: z.string().url().optional().or(z.literal('')).nullable(),
  fundingOfferBannerLinkUrl: z.string().url().optional().or(z.literal('')).nullable(),
  successCaseBannerLinkUrl: z.string().url().optional().or(z.literal('')).nullable(),
  technologyBannerPosition: orgBannerPositionSchema,
  challengeBannerPosition: orgBannerPositionSchema,
  fundingOfferBannerPosition: orgBannerPositionSchema,
  successCaseBannerPosition: orgBannerPositionSchema,
});

export const addMemberBodySchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['ORG_ADMIN', 'ORG_MEMBER']).default('ORG_MEMBER'),
});

const bannerPositionField = z
  .enum([BannerPosition.ABOVE_HERO, BannerPosition.BELOW_HERO, BannerPosition.ABOVE_FOOTER])
  .nullable()
  .optional();

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  summary: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  technologyBannerUrl: z.string().nullable().optional(),
  challengeBannerUrl: z.string().nullable().optional(),
  fundingOfferBannerUrl: z.string().nullable().optional(),
  successCaseBannerUrl: z.string().nullable().optional(),
  technologyBannerLinkUrl: z.string().nullable().optional(),
  challengeBannerLinkUrl: z.string().nullable().optional(),
  fundingOfferBannerLinkUrl: z.string().nullable().optional(),
  successCaseBannerLinkUrl: z.string().nullable().optional(),
  technologyBannerPosition: bannerPositionField,
  challengeBannerPosition: bannerPositionField,
  fundingOfferBannerPosition: bannerPositionField,
  successCaseBannerPosition: bannerPositionField,
  verificationStatus: z.enum([
    OrgVerificationStatus.PENDING,
    OrgVerificationStatus.VERIFIED,
    OrgVerificationStatus.REJECTED,
  ]),
});

export type CreateOrganizationBody = z.infer<typeof createOrganizationBodySchema>;
export type UpdateOrganizationBody = z.infer<typeof updateOrganizationBodySchema>;
export type UpdateOrganizationMediaBody = z.infer<typeof updateOrganizationMediaBodySchema>;
export type AddMemberBody = z.infer<typeof addMemberBodySchema>;
