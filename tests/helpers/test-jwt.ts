import { sign } from 'hono/jwt';
import { UserRole } from '../../src/core/interfaces/auth.interface.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-minimum-16-chars';

export const TEST_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
export const TEST_TENANT_SLUG = 'test-tenant';
export const TEST_USER_ID = '660e8400-e29b-41d4-a716-446655440001';
export const TEST_TENANT_CODE = 'TESTCODE01';

export async function generateTestToken(overrides?: {
  sub?: string;
  tenantId?: string | null;
  tenantSlug?: string | null;
  email?: string;
  role?: UserRole | null;
  type?: 'access' | 'refresh';
  exp?: number;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    sub: overrides?.sub || TEST_USER_ID,
    tenantId: overrides?.tenantId !== undefined ? overrides.tenantId : TEST_TENANT_ID,
    tenantSlug: overrides?.tenantSlug !== undefined ? overrides.tenantSlug : TEST_TENANT_SLUG,
    email: overrides?.email || 'test@example.com',
    role: overrides?.role !== undefined ? overrides.role : UserRole.OWNER,
    type: overrides?.type || 'access',
    iat: now,
    exp: overrides?.exp || now + 3600,
  };
  return sign(payload, JWT_SECRET);
}

export async function generateExpiredToken(): Promise<string> {
  return generateTestToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
}

export async function generateTokenWithoutTenant(): Promise<string> {
  return generateTestToken({ tenantId: null, tenantSlug: null, role: null });
}

export async function authHeaders(tokenOverrides?: Parameters<typeof generateTestToken>[0]): Promise<Record<string, string>> {
  const token = await generateTestToken(tokenOverrides);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
