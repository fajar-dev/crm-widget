import { z } from 'zod';
import { UserRole } from '../enums/auth.enum.ts';

/**
 * Registration request schema.
 */
export const registerSchema = z.object({
  firstName: z.string().min(1).max(100).openapi({
    description: 'User first name',
    example: 'John',
  }),
  lastName: z.string().min(1).max(100).openapi({
    description: 'User last name',
    example: 'Doe',
  }),
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'john@example.com',
  }),
  password: z.string().min(8).max(128).openapi({
    description: 'Password (min 8 characters)',
    example: 'SecurePass123!',
  }),
  role: z.nativeEnum(UserRole).optional().default(UserRole.MEMBER).openapi({
    description: 'User role',
    example: UserRole.MEMBER,
  }),
}).openapi('RegisterRequest');

/**
 * Login request schema.
 */
export const loginSchema = z.object({
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'john@example.com',
  }),
  password: z.string().min(1).openapi({
    description: 'User password',
    example: 'SecurePass123!',
  }),
}).openapi('LoginRequest');

/**
 * Refresh token request schema.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).openapi({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  }),
}).openapi('RefreshTokenRequest');

/**
 * Auth response schemas for OpenAPI documentation.
 */
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('UserResponse');

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.string(),
}).openapi('AuthTokens');

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
