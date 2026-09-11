import { z } from 'zod';
import { UserRole, UserStatus } from '../enums.js';

export const adminUserRoleSchema = z.enum([
  UserRole.ADMIN,
  UserRole.CURADOR,
  UserRole.ORG_ADMIN,
  UserRole.ORG_MEMBER,
]);

export const adminUserStatusSchema = z.enum([UserStatus.ACTIVE, UserStatus.DISABLED]);

export const updateAdminUserBodySchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    role: adminUserRoleSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined || data.role !== undefined, {
    message: 'empty',
  });

export const resetAdminUserPasswordBodySchema = z.object({
  password: z.string().max(128).optional(),
});

export type UpdateAdminUserBody = z.infer<typeof updateAdminUserBodySchema>;
export type ResetAdminUserPasswordBody = z.infer<typeof resetAdminUserPasswordBodySchema>;
