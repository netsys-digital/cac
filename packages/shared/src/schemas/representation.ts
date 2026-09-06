import { z } from 'zod';
import { RepresentationStatus } from '../enums.js';

export const createRepresentationBodySchema = z.object({
  unit: z.string().min(2).max(200),
  linkRole: z.string().min(2).max(120),
  interest: z.string().min(10).max(2000),
});

export const representationRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  unit: z.string(),
  linkRole: z.string(),
  interest: z.string(),
  status: z.enum([
    RepresentationStatus.REQUESTED,
    RepresentationStatus.UNDER_REVIEW,
    RepresentationStatus.APPROVED,
    RepresentationStatus.REJECTED,
  ]),
});

export type CreateRepresentationBody = z.infer<typeof createRepresentationBodySchema>;
