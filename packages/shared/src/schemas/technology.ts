import { z } from 'zod';
import { BannerPosition, ClimateAction, ContentStatus, Maturity } from '../enums.js';
import { callCardFields } from './callCard.js';

const bannerPositionSchema = z
  .enum([BannerPosition.ABOVE_HERO, BannerPosition.BELOW_HERO, BannerPosition.ABOVE_FOOTER])
  .optional();

const optionalText = (max: number) => z.string().max(max).optional().nullable();

const optionalHttpUrl = z
  .string()
  .max(500)
  .optional()
  .nullable()
  .refine((v) => v == null || v === '' || /^https?:\/\/.+/i.test(v), {
    message: 'invalid_official_url',
  });

export const createTechnologyBodySchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  summary: z.string().min(10).max(2000),
  problemStatement: z.string().min(10).max(5000),
  howItWorks: z.string().min(10).max(5000),
  videoUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .refine((v) => v == null || v === '' || /^https?:\/\/.+/i.test(v), {
      message: 'invalid_video_url',
    }),
  bannerLinkUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .refine((v) => v == null || v === '' || /^https?:\/\/.+/i.test(v), {
      message: 'invalid_banner_link_url',
    }),
  bannerPosition: bannerPositionSchema,
  organizationId: z.string().uuid(),
  country: z.string().length(2),
  region: z.string().min(2).max(64),
  climateAction: z
    .enum([ClimateAction.ADAPTATION, ClimateAction.MITIGATION, ClimateAction.BOTH])
    .optional(),
  maturity: z.enum([
    Maturity.RESEARCH,
    Maturity.VALIDATION,
    Maturity.DEMONSTRATION,
    Maturity.READY_FOR_IMPLEMENTATION,
    Maturity.AT_SCALE,
  ]),
  tags: z.array(z.string().min(1).max(64)).min(1).max(20),
  developedWithPartners: z.boolean().optional().nullable(),
  partnerInstitutions: optionalText(2000),
  methodology: optionalText(5000),
  launchYear: z.number().int().min(1900).max(2100).optional().nullable(),
  state: optionalText(120),
  biome: optionalText(200),
  responsibleUnit: optionalText(300),
  accessInfo: optionalText(2000),
  keywords: z.array(z.string().min(1).max(64)).max(30).optional(),
  officialUrl: optionalHttpUrl,
  ...callCardFields,
});

export const updateTechnologyBodySchema = createTechnologyBodySchema
  .omit({ organizationId: true })
  .partial();

export const technologySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  problemStatement: z.string(),
  howItWorks: z.string(),
  videoUrl: z.string().nullable().optional(),
  status: z.enum([
    ContentStatus.DRAFT,
    ContentStatus.IN_REVIEW,
    ContentStatus.PUBLISHED,
    ContentStatus.ARCHIVED,
  ]),
  organizationId: z.string().uuid(),
  country: z.string(),
  region: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateTechnologyBody = z.infer<typeof createTechnologyBodySchema>;
export type UpdateTechnologyBody = z.infer<typeof updateTechnologyBodySchema>;
