import { z } from 'zod';
import { ClimateAction, ContentStatus, Maturity } from '../enums.js';

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
  organizationId: z.string().uuid(),
  country: z.string().length(2),
  region: z.string().max(64).optional(),
  climateAction: z
    .enum([ClimateAction.ADAPTATION, ClimateAction.MITIGATION, ClimateAction.BOTH])
    .optional(),
  maturity: z
    .enum([
      Maturity.RESEARCH,
      Maturity.VALIDATION,
      Maturity.DEMONSTRATION,
      Maturity.READY_FOR_IMPLEMENTATION,
      Maturity.AT_SCALE,
    ])
    .optional(),
  tags: z.array(z.string().min(1).max(64)).max(20).optional(),
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
