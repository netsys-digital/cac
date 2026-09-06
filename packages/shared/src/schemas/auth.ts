import { z } from 'zod';
import { UserRole } from '../enums.js';

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(120),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum([
    UserRole.ADMIN,
    UserRole.CURADOR,
    UserRole.ORG_ADMIN,
    UserRole.ORG_MEMBER,
  ]),
});

export const meResponseSchema = z.object({
  user: authUserSchema,
});

export const authTokensResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
export type AuthTokensResponse = z.infer<typeof authTokensResponseSchema>;
