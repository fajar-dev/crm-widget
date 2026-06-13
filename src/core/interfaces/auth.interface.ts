/**
 * User roles for authorization.
 * Shared across all modules via core.
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
}

/**
 * JWT token payload structure.
 */
export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Authenticated user info available in Hono context.
 */
export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
}
