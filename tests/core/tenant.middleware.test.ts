import { describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import { tenantMiddleware } from '../../src/core/middlewares/tenant.middleware.ts';

describe('Tenant Middleware', () => {
  const app = new Hono();
  app.use('/*', tenantMiddleware);
  app.get('/test', (c) => c.json({ tenantId: c.get('tenantId') }));

  test('rejects request without X-Tenant-ID header', async () => {
    const res = await app.request('/test');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('rejects request with empty X-Tenant-ID', async () => {
    const res = await app.request('/test', {
      headers: { 'X-Tenant-ID': '' },
    });
    expect(res.status).toBe(400);
  });

  test('rejects request with invalid UUID format', async () => {
    const res = await app.request('/test', {
      headers: { 'X-Tenant-ID': 'not-a-uuid' },
    });
    expect(res.status).toBe(400);
  });

  test('accepts valid UUID and sets tenantId in context', async () => {
    const tenantId = '550e8400-e29b-41d4-a716-446655440000';
    const res = await app.request('/test', {
      headers: { 'X-Tenant-ID': tenantId },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { tenantId: string };
    expect(body.tenantId).toBe(tenantId);
  });
});
