import { z } from 'zod';
import { ConnectionObjective, ConnectionTargetType } from '../enums.js';

export const createConnectionBodySchema = z.object({
  requesterOrgId: z.string().uuid(),
  targetType: z.enum([
    ConnectionTargetType.TECHNOLOGY,
    ConnectionTargetType.PROJECT,
    ConnectionTargetType.FUNDING_OFFER,
    ConnectionTargetType.SUCCESS_CASE,
    ConnectionTargetType.CHALLENGE,
    ConnectionTargetType.ORGANIZATION,
  ]),
  targetId: z.string().uuid(),
  objective: z.enum([
    ConnectionObjective.KNOW_MORE,
    ConnectionObjective.IMPLEMENT_SOLUTION,
    ConnectionObjective.PARTNERSHIP,
    ConnectionObjective.FUNDING,
  ]),
  message: z.string().max(2000).optional(),
});

export const savedItemBodySchema = z.object({
  targetType: z.enum([
    ConnectionTargetType.TECHNOLOGY,
    ConnectionTargetType.PROJECT,
    ConnectionTargetType.FUNDING_OFFER,
    ConnectionTargetType.SUCCESS_CASE,
    ConnectionTargetType.CHALLENGE,
    ConnectionTargetType.ORGANIZATION,
  ]),
  targetId: z.string().uuid(),
});

export const followBodySchema = z.object({
  organizationId: z.string().uuid(),
});

export type CreateConnectionBody = z.infer<typeof createConnectionBodySchema>;
export type SavedItemBody = z.infer<typeof savedItemBodySchema>;
export type FollowBody = z.infer<typeof followBodySchema>;
