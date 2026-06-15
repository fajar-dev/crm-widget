import type { DataSource } from 'typeorm';
import { User } from '../../src/modules/user/entities/user.entity.ts';
import { Tenant } from '../../src/modules/tenant/entities/tenant.entity.ts';
import { UserTenant } from '../../src/modules/tenant/entities/user-tenant.entity.ts';
import { UserRole } from '../../src/core/interfaces/auth.interface.ts';
import { MembershipStatus } from '../../src/modules/tenant/enums/tenant.enum.ts';
import { TEST_TENANT_ID, TEST_USER_ID, TEST_TENANT_CODE, TEST_TENANT_SLUG } from './test-jwt.ts';

export async function seedUser(ds: DataSource, overrides?: Partial<User>): Promise<User> {
  const repo = ds.getRepository(User);
  const hashedPassword = await Bun.password.hash('TestPass123!', { algorithm: 'bcrypt', cost: 4 });

  const user = repo.create({
    id: TEST_USER_ID,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: hashedPassword,
    isActive: true,
    ...overrides,
  });

  return repo.save(user);
}

export async function seedTenant(ds: DataSource, overrides?: Partial<Tenant>): Promise<Tenant> {
  const repo = ds.getRepository(Tenant);

  const tenant = repo.create({
    id: TEST_TENANT_ID,
    name: 'Test Tenant',
    company: 'Test Company',
    slug: TEST_TENANT_SLUG,
    code: TEST_TENANT_CODE,
    isActive: true,
    ...overrides,
  });

  return repo.save(tenant);
}

export async function seedUserTenant(
  ds: DataSource,
  overrides?: Partial<UserTenant>,
): Promise<UserTenant> {
  const repo = ds.getRepository(UserTenant);

  const userTenant = repo.create({
    userId: TEST_USER_ID,
    tenantId: TEST_TENANT_ID,
    role: UserRole.OWNER,
    status: MembershipStatus.ACTIVE,
    joinedAt: new Date(),
    ...overrides,
  });

  return repo.save(userTenant);
}

export async function seedFullContext(ds: DataSource): Promise<{ user: User; tenant: Tenant; membership: UserTenant }> {
  const user = await seedUser(ds);
  const tenant = await seedTenant(ds);
  const membership = await seedUserTenant(ds);
  return { user, tenant, membership };
}
