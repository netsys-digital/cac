import { z } from 'zod';
import { OrgVerificationStatus } from '../enums.js';

export const createOrganizationBodySchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  summary: z.string().max(2000).optional(),
  country: z.string().length(2).optional(),
  region: z.string().max(64).optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export const updateOrganizationBodySchema = createOrganizationBodySchema.partial();

export const addMemberBodySchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['ORG_ADMIN', 'ORG_MEMBER']).default('ORG_MEMBER'),
});

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  summary: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  verificationStatus: z.enum([
    OrgVerificationStatus.PENDING,
    OrgVerificationStatus.VERIFIED,
    OrgVerificationStatus.REJECTED,
  ]),
});

export type CreateOrganizationBody = z.infer<typeof createOrganizationBodySchema>;
export type UpdateOrganizationBody = z.infer<typeof updateOrganizationBodySchema>;
export type AddMemberBody = z.infer<typeof addMemberBodySchema>;
