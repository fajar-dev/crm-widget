export enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  MEMBER = 'member',
}

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  role: UserRole | null;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  tenantId: string | null;
  role: UserRole | null;
}
