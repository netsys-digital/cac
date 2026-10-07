import { z } from 'zod';
import { BannerPosition, ContentStatus, NeedType } from '../enums.js';
import { callCardFields } from './callCard.js';
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
  country: z.string().length(2),
  region: z.string().min(2).max(64),
  organizationId: z.string().uuid().optional(),
});

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
});

export const updateSuccessCaseBodySchema = createSuccessCaseBodySchema.partial().omit({
  organizationId: true,
});

export type CreateFundingOfferBody = z.infer<typeof createFundingOfferBodySchema>;
export type UpdateFundingOfferBody = z.infer<typeof updateFundingOfferBodySchema>;
export type CreateFunderProfileBody = z.infer<typeof createFunderProfileBodySchema>;
export type CreateSuccessCaseBody = z.infer<typeof createSuccessCaseBodySchema>;
export type UpdateSuccessCaseBody = z.infer<typeof updateSuccessCaseBodySchema>;
