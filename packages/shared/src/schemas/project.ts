import { z } from 'zod';
import { ContentStatus, ProjectType } from '../enums.js';

export const createProjectBodySchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  type: z.enum([
    ProjectType.PROJECT,
    ProjectType.INITIATIVE,
    ProjectType.POLICY,
    ProjectType.PROGRAMME,
  ]),
  summary: z.string().min(10).max(2000),
  organizationId: z.string().uuid(),
  country: z.string().length(2).optional(),
  region: z.string().max(64).optional(),
  status: z
    .enum([ContentStatus.DRAFT, ContentStatus.IN_REVIEW, ContentStatus.PUBLISHED])
    .optional(),
});

export const updateProjectBodySchema = createProjectBodySchema.omit({ organizationId: true }).partial();

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
