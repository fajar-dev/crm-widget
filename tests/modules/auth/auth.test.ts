import { describe, expect, test, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import type { DataSource } from 'typeorm';
import { createTestDataSource, destroyTestDataSource, clearAllTables } from '../../helpers/test-database.ts';
import { authHeaders } from '../../helpers/test-jwt.ts';
import { seedUser, seedTenant, seedUserTenant, seedFullContext } from '../../helpers/seed.ts';
import { Container } from '../../../src/container.ts';
import { createMockTenantDataSourceManager } from '../../helpers/mock-tenant-ds.ts';
import { authRoutes } from '../../../src/routes/api/auth.ts';
import { errorHandler } from '../../../src/core/middlewares/error-handler.middleware.ts';

describe('Auth Module — Integration Tests', () => {
  let app: Hono;
  let ds: DataSource;

  const headers = { 'Content-Type': 'application/json' };

  beforeAll(async () => {
    ds = await createTestDataSource();
    const container = new Container(ds, createMockTenantDataSourceManager());

    app = new Hono();
    app.onError(errorHandler);
    app.route('/auth', authRoutes(container));
  });

  afterAll(async () => {
    await destroyTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(ds);
  });

  // ── Register ────────────────────────────────────────────
  describe('POST /auth/register', () => {
    test('registers a new global user (no tenant)', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe('john@example.com');
      expect(body.data.user.phone).toBeNull();
      expect(body.data.tokens.accessToken).toBeDefined();
    });

    test('registers with optional phone', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'SecurePass123!',
          phone: '+6281234567890',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json() as any;
      expect(body.data.user.phone).toBe('+6281234567890');
    });

    test('rejects duplicate email', async () => {
      await seedUser(ds);

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: 'Duplicate',
          lastName: 'User',
          email: 'test@example.com',
          password: 'SecurePass123!',
        }),
      });

      expect(res.status).toBe(409);
    });

    test('rejects invalid email format', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: 'Bad',
          lastName: 'Email',
          email: 'not-an-email',
          password: 'SecurePass123!',
        }),
      });

      expect(res.status).toBe(422);
    });

    test('rejects short password', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: 'Short',
          lastName: 'Pass',
          email: 'short@example.com',
          password: '123',
        }),
      });

      expect(res.status).toBe(422);
    });
  });

  // ── Login ───────────────────────────────────────────────
  describe('POST /auth/login', () => {
    test('logs in and returns tenants list', async () => {
      await seedFullContext(ds);

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPass123!',
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.data.tenants).toBeArray();
      expect(body.data.tenants.length).toBe(1);
      expect(body.data.activeTenant).toBeDefined();
      expect(body.data.activeTenant.name).toBe('Test Tenant');
      expect(body.data.tokens.accessToken).toBeDefined();
    });

    test('logs in user with no tenants', async () => {
      await seedUser(ds);

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPass123!',
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.tenants).toBeArray();
      expect(body.data.tenants.length).toBe(0);
      expect(body.data.activeTenant).toBeNull();
    });

    test('rejects wrong password', async () => {
      await seedUser(ds);

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword!',
        }),
      });

      expect(res.status).toBe(401);
    });

    test('rejects non-existent email', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'nobody@example.com',
          password: 'SomePass123!',
        }),
      });

      expect(res.status).toBe(401);
    });

    test('rejects deactivated user', async () => {
      await seedUser(ds, { isActive: false });

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPass123!',
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  // ── Refresh Token ──────────────────────────────────────
  describe('POST /auth/refresh', () => {
    test('refreshes token successfully', async () => {
      await seedUser(ds);

      const loginRes = await app.request('/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPass123!',
        }),
      });
      const loginBody = await loginRes.json() as any;
      const refreshToken = loginBody.data.tokens.refreshToken;

      const res = await app.request('/auth/refresh', {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
    });

    test('rejects invalid refresh token', async () => {
      const res = await app.request('/auth/refresh', {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken: 'invalid-token' }),
      });

      expect(res.status).toBe(401);
    });
  });

  // ── Logout ─────────────────────────────────────────────
  describe('POST /auth/logout', () => {
    test('logs out and revokes refresh token', async () => {
      await seedUser(ds);

      const loginRes = await app.request('/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPass123!',
        }),
      });
      const loginBody = await loginRes.json() as any;
      const refreshToken = loginBody.data.tokens.refreshToken;

      const res = await app.request('/auth/logout', {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken }),
      });

      expect(res.status).toBe(200);

      const refreshRes = await app.request('/auth/refresh', {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken }),
      });
      expect(refreshRes.status).toBe(401);
    });
  });

  // ── Profile ────────────────────────────────────────────
  describe('GET /auth/me', () => {
    test('returns user profile with tenant info', async () => {
      await seedFullContext(ds);

      const loginRes = await app.request('/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPass123!',
        }),
      });
      const loginBody = await loginRes.json() as any;
      const accessToken = loginBody.data.tokens.accessToken;

      const res = await app.request('/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.data.tenants).toBeArray();
      expect(body.data.activeTenant).toBeDefined();
    });

    test('rejects unauthenticated request', async () => {
      const res = await app.request('/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // ── Switch Tenant ──────────────────────────────────────
  describe('POST /auth/switch-tenant', () => {
    test('switches to a different tenant', async () => {
      const { user } = await seedFullContext(ds);

      // Create a second tenant
      const secondTenant = await seedTenant(ds, {
        id: '770e8400-e29b-41d4-a716-446655440002',
        name: 'Second Tenant',
        company: 'Second Company',
        slug: 'second-tenant',
        code: 'SECOND01',
      });
      await seedUserTenant(ds, {
        userId: user.id,
        tenantId: secondTenant.id,
      });

      // Login first
      const loginRes = await app.request('/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPass123!',
        }),
      });
      const loginBody = await loginRes.json() as any;
      const accessToken = loginBody.data.tokens.accessToken;

      // Switch tenant
      const res = await app.request('/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId: secondTenant.id }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.activeTenant.name).toBe('Second Tenant');
      expect(body.data.tokens.accessToken).toBeDefined();
    });
  });
});
