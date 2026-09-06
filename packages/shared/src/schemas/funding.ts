import { z } from 'zod';
import { ContentStatus, NeedType } from '../enums.js';

export const createFundingOfferBodySchema = z.object({
  title: z.string().min(3).max(240),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  summary: z.string().min(10).max(2000),
  whatFunds: z.string().max(2000).optional(),
  criteria: z.string().max(2000).optional(),
  amountRange: z.string().max(120).optional(),
  officialUrl: z.string().url().optional().or(z.literal('')),
  deadline: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), { message: 'invalid_deadline' }),
  country: z.string().length(2).optional(),
  region: z.string().max(64).optional(),
  organizationId: z.string().uuid(),
  status: z
    .enum([ContentStatus.DRAFT, ContentStatus.IN_REVIEW, ContentStatus.PUBLISHED])
    .optional(),
});

export const updateFundingOfferBodySchema = createFundingOfferBodySchema.partial().omit({
  organizationId: true,
});

export const createFunderProfileBodySchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  summary: z.string().min(10).max(2000),
  country: z.string().length(2).optional(),
  region: z.string().max(64).optional(),
  organizationId: z.string().uuid().optional(),
});

export const createSuccessCaseBodySchema = z.object({
  title: z.string().min(3).max(240),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  summary: z.string().min(10).max(2000),
  context: z.string().max(4000).optional(),
  outcomes: z.string().max(4000).optional(),
  country: z.string().length(2),
  region: z.string().max(64).optional(),
  organizationId: z.string().uuid(),
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
        detail: z.string().max(500).optional(),
      }),
    )
    .optional(),
  evidenceNotes: z.array(z.string().max(500)).optional(),
});

export const updateSuccessCaseBodySchema = createSuccessCaseBodySchema.partial().omit({
  organizationId: true,
});

export type CreateFundingOfferBody = z.infer<typeof createFundingOfferBodySchema>;
export type UpdateFundingOfferBody = z.infer<typeof updateFundingOfferBodySchema>;
export type CreateFunderProfileBody = z.infer<typeof createFunderProfileBodySchema>;
export type CreateSuccessCaseBody = z.infer<typeof createSuccessCaseBodySchema>;
export type UpdateSuccessCaseBody = z.infer<typeof updateSuccessCaseBodySchema>;
