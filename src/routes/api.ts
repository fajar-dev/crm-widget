import { Hono } from 'hono';
import type { DataSource } from 'typeorm';
import { tenantMiddleware } from '../core/middlewares/tenant.middleware.ts';
import { authMiddleware, requireTenant } from '../core/middlewares/auth.middleware.ts';
import { Container } from '../container.ts';
import { authRoutes } from './api/auth.ts';
import { tenantRoutes } from './api/tenants.ts';
import { contactRoutes } from './api/contacts.ts';

export function createApiRouter(dataSource: DataSource) {
  const api = new Hono();
  const container = new Container(dataSource);

  // Auth routes — NO tenant middleware (public + auth-only)
  api.route('/auth', authRoutes(container));

  // Tenant routes — auth required, NO tenant middleware
  api.route('/tenants', tenantRoutes(container));

  // Contact routes — auth + tenant required
  api.use('/contacts/*', authMiddleware, requireTenant);
  api.route('/contacts', contactRoutes(container));

  return api;
}
