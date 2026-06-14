import { describe, expect, test, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import type { DataSource } from 'typeorm';
import { createTestDataSource, createTestTenantDataSource, destroyTestDataSource, clearAllTables } from '../../helpers/test-database.ts';
import { authHeaders } from '../../helpers/test-jwt.ts';
import { seedUser, seedContacts } from '../../helpers/seed.ts';
import { ContactController } from '../../../src/modules/contacts/contact.controller.ts';
import { ContactRepository } from '../../../src/modules/contacts/repositories/contact.repository.ts';
import { ContactService } from '../../../src/modules/contacts/contact.service.ts';
import { errorHandler } from '../../../src/core/middlewares/error-handler.middleware.ts';
import { authMiddleware, requireTenant } from '../../../src/core/middlewares/auth.middleware.ts';
import { createContactSchema, updateContactSchema } from '../../../src/modules/contacts/validators/contact.validator.ts';
import { paginationSchema } from '../../../src/core/validators/pagination.schema.ts';
import { validate } from '../../../src/core/helpers/validator.ts';

describe('Contact Module — Integration Tests', () => {
  let app: Hono;
  let sharedDs: DataSource;
  let tenantDs: DataSource;
  let headers: Record<string, string>;

  beforeAll(async () => {
    sharedDs = await createTestDataSource();
    tenantDs = await createTestTenantDataSource();
    headers = await authHeaders();

    // Create controller with service factory that uses tenant DataSource
    const controller = new ContactController(async (_tenantSlug: string) => {
      const repo = new ContactRepository(tenantDs);
      return new ContactService(repo);
    });

    app = new Hono();
    app.onError(errorHandler);
    app.use('/*', authMiddleware, requireTenant);

    app.get('/contacts', validate('query', paginationSchema), (c) => controller.index(c));
    app.get('/contacts/:id', (c) => controller.show(c));
    app.post('/contacts', validate('json', createContactSchema), (c) => controller.store(c));
    app.put('/contacts/:id', validate('json', updateContactSchema), (c) => controller.update(c));
    app.delete('/contacts/:id', (c) => controller.destroy(c));
  });

  afterAll(async () => {
    await destroyTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(sharedDs);
    await clearAllTables(tenantDs);
    await seedUser(sharedDs);
  });

  // ── List Contacts ──────────────────────────────────────
  describe('GET /contacts', () => {
    test('returns empty list when no contacts', async () => {
      const res = await app.request('/contacts?page=1&perPage=10', { headers });
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    test('returns paginated contacts', async () => {
      await seedContacts(tenantDs, 5);

      const res = await app.request('/contacts?page=1&perPage=2', { headers });
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.length).toBe(2);
      expect(body.meta.total).toBe(5);
      expect(body.meta.lastPage).toBe(3);
      expect(body.meta.currentPage).toBe(1);
    });

    test('returns second page of contacts', async () => {
      await seedContacts(tenantDs, 5);

      const res = await app.request('/contacts?page=2&perPage=2', { headers });
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.length).toBe(2);
      expect(body.meta.currentPage).toBe(2);
    });

    test('searches contacts by name', async () => {
      await seedContacts(tenantDs, 3);

      const res = await app.request('/contacts?search=Contact1', { headers });
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.length).toBe(1);
      expect(body.data[0].firstName).toBe('Contact1');
    });

    test('rejects unauthenticated request', async () => {
      const res = await app.request('/contacts');
      expect(res.status).toBe(401);
    });
  });

  // ── Create Contact ─────────────────────────────────────
  describe('POST /contacts', () => {
    test('creates a new contact', async () => {
      const res = await app.request('/contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: 'Alice',
          lastName: 'Wonderland',
          email: 'alice@example.com',
          phone: '+62812345678',
          company: 'Nusanet',
          jobTitle: 'Engineer',
          status: 'lead',
          source: 'website',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.firstName).toBe('Alice');
      expect(body.data.email).toBe('alice@example.com');
      expect(body.data.company).toBe('Nusanet');
      expect(body.data.id).toBeDefined();
    });

    test('creates contact with minimal fields', async () => {
      const res = await app.request('/contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: 'Minimal',
          lastName: 'Contact',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json() as any;
      expect(body.data.status).toBe('lead');
      expect(body.data.source).toBe('other');
    });

    test('rejects missing required fields', async () => {
      const res = await app.request('/contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: 'only@email.com' }),
      });

      expect(res.status).toBe(422);
    });

    test('rejects invalid email format', async () => {
      const res = await app.request('/contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: 'Bad',
          lastName: 'Email',
          email: 'not-an-email',
        }),
      });

      expect(res.status).toBe(422);
    });
  });

  // ── Get Contact ────────────────────────────────────────
  describe('GET /contacts/:id', () => {
    test('returns contact by ID', async () => {
      const [contact] = await seedContacts(tenantDs, 1);

      const res = await app.request(`/contacts/${contact!.id}`, { headers });
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.id).toBe(contact!.id);
      expect(body.data.firstName).toBe('Contact1');
    });

    test('returns 404 for non-existent ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await app.request(`/contacts/${fakeId}`, { headers });
      expect(res.status).toBe(404);
    });
  });

  // ── Update Contact ─────────────────────────────────────
  describe('PUT /contacts/:id', () => {
    test('updates contact fields', async () => {
      const [contact] = await seedContacts(tenantDs, 1);

      const res = await app.request(`/contacts/${contact!.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          firstName: 'Updated',
          company: 'New Company',
          status: 'customer',
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.firstName).toBe('Updated');
      expect(body.data.company).toBe('New Company');
      expect(body.data.status).toBe('customer');
    });

    test('returns 404 for non-existent ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await app.request(`/contacts/${fakeId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ firstName: 'Ghost' }),
      });
      expect(res.status).toBe(404);
    });
  });

  // ── Delete Contact ─────────────────────────────────────
  describe('DELETE /contacts/:id', () => {
    test('deletes contact successfully', async () => {
      const [contact] = await seedContacts(tenantDs, 1);

      const res = await app.request(`/contacts/${contact!.id}`, {
        method: 'DELETE',
        headers,
      });
      expect(res.status).toBe(200);

      // Verify it's deleted
      const getRes = await app.request(`/contacts/${contact!.id}`, { headers });
      expect(getRes.status).toBe(404);
    });

    test('returns 404 for non-existent ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await app.request(`/contacts/${fakeId}`, {
        method: 'DELETE',
        headers,
      });
      expect(res.status).toBe(404);
    });
  });
});
