import { describe, expect, test, beforeAll } from 'bun:test';
import { Hono } from 'hono';
import { authMiddleware } from '../../src/core/middlewares/auth.middleware.ts';
import { errorHandler } from '../../src/core/middlewares/error-handler.middleware.ts';
import { generateTestToken, generateExpiredToken, TEST_TENANT_ID } from '../helpers/test-jwt.ts';

describe('Auth Middleware', () => {
  const app = new Hono();
  app.onError(errorHandler);
  app.use('/*', authMiddleware);
  app.get('/test', (c) => {
    const user = c.get('user');
    return c.json({ user, tenantId: c.get('tenantId') });
  });

  test('rejects request without Authorization header', async () => {
    const res = await app.request('/test');
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.success).toBe(false);
    expect(body.message).toContain('Authorization');
  });

  test('rejects request with invalid Bearer format', async () => {
    const res = await app.request('/test', {
      headers: { 'Authorization': 'InvalidFormat token' },
    });
    expect(res.status).toBe(401);
  });

  test('rejects expired token', async () => {
    const expiredToken = await generateExpiredToken();
    const res = await app.request('/test', {
      headers: { 'Authorization': `Bearer ${expiredToken}` },
    });
    expect(res.status).toBe(401);
  });

  test('rejects refresh token used as access', async () => {
    const refreshToken = await generateTestToken({ type: 'refresh' });
    const res = await app.request('/test', {
      headers: { 'Authorization': `Bearer ${refreshToken}` },
    });
    expect(res.status).toBe(401);
  });

  test('accepts valid access token and sets user context', async () => {
    const token = await generateTestToken();
    const res = await app.request('/test', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('test@example.com');
    expect(body.tenantId).toBe(TEST_TENANT_ID);
  });
});
