import type { UserRole } from '../../core/interfaces/auth.interface.ts';

/**
 * Auth token pair returned on login/register.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
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
