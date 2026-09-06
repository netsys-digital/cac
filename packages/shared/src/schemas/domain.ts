import { z } from 'zod';

export const createDomainBodySchema = z.object({
  grouping: z.string().min(2).max(64),
  key: z.string().min(1).max(64),
  labelPt: z.string().min(1).max(200),
  labelEn: z.string().min(1).max(200),
  sortOrder: z.number().int().optional(),
});

export const updateDomainBodySchema = createDomainBodySchema.partial();

export type CreateDomainBody = z.infer<typeof createDomainBodySchema>;
export type UpdateDomainBody = z.infer<typeof updateDomainBodySchema>;
