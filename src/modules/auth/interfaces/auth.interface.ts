import type { UserRole } from '../../../core/interfaces/auth.interface.ts';
import type { SerializedUser } from '../../user/serializers/user.serializer.ts';
import type { SerializedTenant } from '../../tenant/serializers/tenant.serializer.ts';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface IAuthService {
  register(data: RegisterInput): Promise<{ user: SerializedUser; tokens: AuthTokens }>;
  login(data: LoginInput): Promise<{ user: SerializedUser; tenants: SerializedTenant[]; activeTenant: SerializedTenant | null; tokens: AuthTokens }>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  getProfile(userId: string): Promise<{ user: SerializedUser; activeTenant: SerializedTenant | null; tenants: SerializedTenant[] }>;
  switchTenant(userId: string, tenantId: string): Promise<{ activeTenant: SerializedTenant; tokens: AuthTokens }>;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
