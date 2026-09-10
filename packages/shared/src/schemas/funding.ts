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
  whatFunds: z.string().min(10).max(2000),
  criteria: z.string().min(10).max(2000),
  amountRange: z.string().max(120).optional(),
  officialUrl: z.string().url().optional().or(z.literal('')),
  deadline: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), { message: 'invalid_deadline' }),
  country: z.string().length(2),
  region: z.string().min(2).max(64),
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
  country: z.string().length(2),
  region: z.string().min(2).max(64),
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
  context: z.string().min(10).max(4000),
  outcomes: z.string().min(10).max(4000),
  country: z.string().length(2),
  region: z.string().min(2).max(64),
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
    .min(1),
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
