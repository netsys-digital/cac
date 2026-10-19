import { z } from 'zod';
import { BannerPosition, ContentStatus, NeedType } from '../enums.js';
import { callCardFields } from './callCard.js';
import { applicationPlacesField } from './places.js';
import { TEXT_LIMITS } from './limits.js';

const bannerPositionSchema = z
  .enum([BannerPosition.ABOVE_HERO, BannerPosition.BELOW_HERO, BannerPosition.ABOVE_FOOTER])
  .optional();

export const createFundingOfferBodySchema = z.object({
  title: z.string().min(3).max(TEXT_LIMITS.title),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  summary: z.string().min(10).max(TEXT_LIMITS.summary),
  whatFunds: z.string().min(10).max(TEXT_LIMITS.longText),
  criteria: z.string().min(10).max(TEXT_LIMITS.longText),
  amountRange: z.string().max(TEXT_LIMITS.shortText).optional(),
  officialUrl: z.string().url().optional().or(z.literal('')),
  deadline: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), { message: 'invalid_deadline' }),
  country: z.string().length(2),
  region: z.string().min(2).max(64),
  organizationId: z.string().uuid(),
  bannerLinkUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .refine((v) => v == null || v === '' || /^https?:\/\/.+/i.test(v), {
      message: 'invalid_banner_link_url',
    }),
  bannerPosition: bannerPositionSchema,
  status: z
    .enum([ContentStatus.DRAFT, ContentStatus.IN_REVIEW, ContentStatus.PUBLISHED])
    .optional(),
  ...callCardFields,
  ...applicationPlacesField,
});

export const updateFundingOfferBodySchema = createFundingOfferBodySchema.partial().omit({
  organizationId: true,
});

export const createFunderProfileBodySchema = z.object({
  name: z.string().min(2).max(TEXT_LIMITS.title),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  summary: z.string().min(10).max(TEXT_LIMITS.summary),
  website: z
    .string()
    .trim()
    .min(8)
    .max(500)
    .refine((v) => /^https?:\/\/.+/i.test(v), { message: 'invalid_website' }),
  interestAreas: z.string().trim().min(10).max(TEXT_LIMITS.summary),
  contactName: z.string().trim().min(2).max(200),
  contactEmail: z.string().trim().email().max(320),
  country: z.string().length(2),
  region: z.string().min(2).max(64),
  organizationId: z.string().uuid().nullable().optional(),
  status: z.enum([ContentStatus.DRAFT, ContentStatus.IN_REVIEW, ContentStatus.PUBLISHED, ContentStatus.ARCHIVED]).optional(),
});

export const updateFunderProfileBodySchema = createFunderProfileBodySchema.partial();

export const createSuccessCaseBodySchema = z.object({
  title: z.string().min(3).max(TEXT_LIMITS.title),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  summary: z.string().min(10).max(TEXT_LIMITS.summary),
  context: z.string().min(10).max(TEXT_LIMITS.longText),
  outcomes: z.string().min(10).max(TEXT_LIMITS.longText),
  country: z.string().length(2),
  region: z.string().min(2).max(64),
  organizationId: z.string().uuid(),
  bannerLinkUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .refine((v) => v == null || v === '' || /^https?:\/\/.+/i.test(v), {
      message: 'invalid_banner_link_url',
    }),
  bannerPosition: bannerPositionSchema,
  needs: z
    .array(
      z.object({
        needType: z.enum([
          NeedType.TECHNOLOGY,
          NeedType.KNOWLEDGE,
          NeedType.PARTNERSHIP,
          NeedType.FUNDING,
          NeedType.TRAINING,
          NeedType.RESEARCH,
          NeedType.EQUIPMENT,
        ]),
        detail: z.string().max(TEXT_LIMITS.evidenceNote).optional(),
      }),
    )
    .optional(),
  evidenceNotes: z.array(z.string().max(TEXT_LIMITS.evidenceNote)).optional(),
  ...callCardFields,
  ...applicationPlacesField,
});

export const updateSuccessCaseBodySchema = createSuccessCaseBodySchema.partial().omit({
  organizationId: true,
});

export type CreateFundingOfferBody = z.infer<typeof createFundingOfferBodySchema>;
export type UpdateFundingOfferBody = z.infer<typeof updateFundingOfferBodySchema>;
export type CreateFunderProfileBody = z.infer<typeof createFunderProfileBodySchema>;
export type UpdateFunderProfileBody = z.infer<typeof updateFunderProfileBodySchema>;
export type CreateSuccessCaseBody = z.infer<typeof createSuccessCaseBodySchema>;
export type UpdateSuccessCaseBody = z.infer<typeof updateSuccessCaseBodySchema>;
