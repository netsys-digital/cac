import { z } from 'zod';
import { ConnectionObjective, ConnectionTargetType } from '../enums.js';
import { TEXT_LIMITS } from './limits.js';

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
  message: z.string().max(TEXT_LIMITS.message).optional(),
});

export const declineConnectionBodySchema = z.object({
  reason: z.string().trim().min(10).max(TEXT_LIMITS.message),
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
export type DeclineConnectionBody = z.infer<typeof declineConnectionBodySchema>;
export type SavedItemBody = z.infer<typeof savedItemBodySchema>;
export type FollowBody = z.infer<typeof followBodySchema>;
