import { describe, expect, test, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import type { DataSource } from 'typeorm';
import { createTestDataSource, destroyTestDataSource, clearAllTables } from '../../helpers/test-database.ts';
import { TEST_TENANT_ID, authHeaders } from '../../helpers/test-jwt.ts';
import { seedUser } from '../../helpers/seed.ts';
import { Container } from '../../../src/container.ts';
import { createAuthModule } from '../../../src/modules/auth/auth.module.ts';
import { tenantMiddleware } from '../../../src/core/middlewares/tenant.middleware.ts';
import { errorHandler } from '../../../src/core/middlewares/error-handler.middleware.ts';

describe('Auth Module — Integration Tests', () => {
  let app: Hono;
  let ds: DataSource;

  const headers = {
    'X-Tenant-ID': TEST_TENANT_ID,
    'Content-Type': 'application/json',
  };

  beforeAll(async () => {
    ds = await createTestDataSource();
    const container = new Container(ds);

    app = new Hono();
    app.onError(errorHandler);
    app.use('/*', tenantMiddleware);
    app.route('/auth', createAuthModule(container));
  });

  afterAll(async () => {
    await destroyTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(ds);
  });

  // ── Register ────────────────────────────────────────────
  describe('POST /auth/register', () => {
    test('registers a new user successfully', async () => {
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
      expect(body.data.tokens.accessToken).toBeDefined();
      expect(body.data.tokens.refreshToken).toBeDefined();
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
      const body = await res.json() as any;
      expect(body.success).toBe(false);
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
    test('logs in with correct credentials', async () => {
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
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.data.tokens.accessToken).toBeDefined();
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

      // Login first to get refresh token
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

      // Now refresh
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
    test('logs out successfully', async () => {
      await seedUser(ds);

      // Login to get refresh token
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

      // Logout
      const res = await app.request('/auth/logout', {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken }),
      });

      expect(res.status).toBe(200);

      // Verify refresh token is revoked
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
    test('returns user profile with valid token', async () => {
      await seedUser(ds);

      // Login to get a real token tied to the user
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
          'X-Tenant-ID': TEST_TENANT_ID,
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.email).toBe('test@example.com');
    });

    test('rejects unauthenticated request', async () => {
      const res = await app.request('/auth/me', {
        headers: { 'X-Tenant-ID': TEST_TENANT_ID },
      });

      expect(res.status).toBe(401);
    });
  });
});
