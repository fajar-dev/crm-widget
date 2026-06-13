import type { UserRole } from '../enums/auth.enum.ts';

/**
 * JWT token payload structure.
 */
export interface JwtPayload {
  sub: string;         // user ID
  tenantId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Login response data.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Authenticated user info (available in Hono context).
 */
export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
}

/**
 * Auth service interface for dependency inversion.
 */
export interface IAuthService {
  register(tenantId: string, data: RegisterInput): Promise<{ user: any; tokens: AuthTokens }>;
  login(tenantId: string, data: LoginInput): Promise<{ user: any; tokens: AuthTokens }>;
  refreshToken(tenantId: string, refreshToken: string): Promise<AuthTokens>;
  logout(tenantId: string, refreshToken: string): Promise<void>;
  getProfile(tenantId: string, userId: string): Promise<any>;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}
