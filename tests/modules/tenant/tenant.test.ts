import { describe, expect, test, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import type { DataSource } from 'typeorm';
import { createTestDataSource, destroyTestDataSource, clearAllTables } from '../../helpers/test-database.ts';
import { TEST_TENANT_ID, authHeaders } from '../../helpers/test-jwt.ts';
import { seedUser, seedTenant, seedUserTenant, seedFullContext } from '../../helpers/seed.ts';
import { Container } from '../../../src/container.ts';
import { createMockTenantDataSourceManager } from '../../helpers/mock-tenant-ds.ts';
import { tenantRoutes } from '../../../src/routes/api/tenants.ts';
import { errorHandler } from '../../../src/core/middlewares/error-handler.middleware.ts';
import { UserRole } from '../../../src/core/interfaces/auth.interface.ts';

describe('Tenant Module — Integration Tests', () => {
  let app: Hono;
  let ds: DataSource;

  beforeAll(async () => {
    ds = await createTestDataSource();
    const container = new Container(ds, createMockTenantDataSourceManager());

    app = new Hono();
    app.onError(errorHandler);
    app.route('/tenants', tenantRoutes(container));
  });

  afterAll(async () => {
    await destroyTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(ds);
  });

  // ── Create Tenant ───────────────────────────────────────
  describe('POST /tenants', () => {
    test('creates a new tenant (user becomes owner)', async () => {
      await seedUser(ds);
      const hdrs = await authHeaders();

      const res = await app.request('/tenants', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          name: 'My Tenant',
          company: 'My Company',
          slug: 'my-tenant',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json() as any;
      expect(body.data.name).toBe('My Tenant');
      expect(body.data.company).toBe('My Company');
      expect(body.data.slug).toBe('my-tenant');
      expect(body.data.code).toBeDefined();
      expect(body.data.role).toBe('owner');
    });

    test('rejects duplicate slug', async () => {
      await seedFullContext(ds);
      const hdrs = await authHeaders();

      const res = await app.request('/tenants', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          name: 'Another',
          company: 'Another Co',
          slug: 'test-tenant', // already exists
        }),
      });

      expect(res.status).toBe(409);
    });
  });

  // ── List Tenants ────────────────────────────────────────
  describe('GET /tenants', () => {
    test('lists user tenants', async () => {
      await seedFullContext(ds);
      const hdrs = await authHeaders();

      const res = await app.request('/tenants', { headers: hdrs });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data).toBeArray();
      expect(body.data.length).toBe(1);
      expect(body.data[0].name).toBe('Test Tenant');
    });
  });

  // ── Join by Code ───────────────────────────────────────
  describe('POST /tenants/join', () => {
    test('joins tenant via code', async () => {
      // Create tenant owned by another user
      const otherUser = await seedUser(ds, {
        id: '880e8400-e29b-41d4-a716-446655440003',
        email: 'owner@example.com',
      });
      const tenant = await seedTenant(ds);
      await seedUserTenant(ds, {
        userId: otherUser.id,
        tenantId: tenant.id,
        role: UserRole.OWNER,
      });

      // New user joins
      const newUser = await seedUser(ds, {
        id: '990e8400-e29b-41d4-a716-446655440004',
        email: 'newuser@example.com',
      });
      const hdrs = await authHeaders({ sub: newUser.id, email: 'newuser@example.com' });

      const res = await app.request('/tenants/join', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ code: 'TESTCODE01' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.name).toBe('Test Tenant');
      expect(body.data.role).toBe('member');
    });

    test('rejects invalid code', async () => {
      await seedUser(ds);
      const hdrs = await authHeaders();

      const res = await app.request('/tenants/join', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ code: 'INVALIDCODE' }),
      });

      expect(res.status).toBe(404);
    });
  });

  // ── Get Members ────────────────────────────────────────
  describe('GET /tenants/:id/members', () => {
    test('lists tenant members', async () => {
      await seedFullContext(ds);
      const hdrs = await authHeaders();

      const res = await app.request(`/tenants/${TEST_TENANT_ID}/members`, {
        headers: hdrs,
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data).toBeArray();
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Update Tenant ──────────────────────────────────────
  describe('PUT /tenants/:id', () => {
    test('owner can update tenant', async () => {
      await seedFullContext(ds);
      const hdrs = await authHeaders();

      const res = await app.request(`/tenants/${TEST_TENANT_ID}`, {
        method: 'PUT',
        headers: hdrs,
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.name).toBe('Updated Name');
    });
  });

  // ── Regenerate Code ────────────────────────────────────
  describe('POST /tenants/:id/regenerate-code', () => {
    test('owner can regenerate invite code', async () => {
      await seedFullContext(ds);
      const hdrs = await authHeaders();

      const res = await app.request(`/tenants/${TEST_TENANT_ID}/regenerate-code`, {
        method: 'POST',
        headers: hdrs,
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.code).toBeDefined();
      expect(body.data.code).not.toBe('TESTCODE01');
    });
  });

  // ── Remove Member ──────────────────────────────────────
  describe('DELETE /tenants/:id/members/:userId', () => {
    test('owner can remove a member', async () => {
      await seedFullContext(ds);

      const memberUser = await seedUser(ds, {
        id: '990e8400-e29b-41d4-a716-446655440005',
        email: 'member@example.com',
      });
      await seedUserTenant(ds, {
        userId: memberUser.id,
        tenantId: TEST_TENANT_ID,
        role: UserRole.MEMBER,
      });

      const hdrs = await authHeaders();

      const res = await app.request(`/tenants/${TEST_TENANT_ID}/members/${memberUser.id}`, {
        method: 'DELETE',
        headers: hdrs,
      });

      expect(res.status).toBe(200);
    });
  });
});
