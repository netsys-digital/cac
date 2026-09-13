import { z } from 'zod';
import { BannerPosition, ContentStatus, NeedType } from '../enums.js';

export const createChallengeBodySchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  summary: z.string().min(10).max(2000),
  context: z.string().min(10).max(5000),
  needType: z.enum([
    NeedType.TECHNOLOGY,
    NeedType.KNOWLEDGE,
    NeedType.PARTNERSHIP,
    NeedType.FUNDING,
    NeedType.TRAINING,
    NeedType.RESEARCH,
    NeedType.EQUIPMENT,
  ]),
  organizationId: z.string().uuid(),
  country: z.string().length(2),
  region: z.string().min(2).max(64),
  tags: z.array(z.string().min(1).max(64)).min(1).max(20),
  bannerLinkUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .refine((v) => v == null || v === '' || /^https?:\/\/.+/i.test(v), {
      message: 'invalid_banner_link_url',
    }),
  bannerPosition: z
    .enum([BannerPosition.ABOVE_HERO, BannerPosition.BELOW_HERO, BannerPosition.ABOVE_FOOTER])
    .optional(),
  status: z
    .enum([ContentStatus.DRAFT, ContentStatus.IN_REVIEW, ContentStatus.PUBLISHED])
    .optional(),
});

export const updateChallengeBodySchema = createChallengeBodySchema
  .omit({ organizationId: true })
  .partial();

export type CreateChallengeBody = z.infer<typeof createChallengeBodySchema>;
export type UpdateChallengeBody = z.infer<typeof updateChallengeBodySchema>;
