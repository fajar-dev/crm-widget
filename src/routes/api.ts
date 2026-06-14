import { Hono } from 'hono';
import type { DataSource } from 'typeorm';
import type { TenantDataSourceManager } from '../config/tenant-datasource.ts';
import { authMiddleware, requireTenant } from '../core/middlewares/auth.middleware.ts';
import { Container } from '../container.ts';
import { authRoutes } from './api/auth.ts';
import { tenantRoutes } from './api/tenants.ts';
import { contactRoutes } from './api/contacts.ts';

export function createApiRouter(sharedDataSource: DataSource, tenantDataSourceManager: TenantDataSourceManager) {
  const api = new Hono();
  const container = new Container(sharedDataSource, tenantDataSourceManager);

  // Auth routes — NO tenant middleware (public + auth-only)
  api.route('/auth', authRoutes(container));

  // Tenant routes — auth required, NO tenant middleware
  api.route('/tenants', tenantRoutes(container));

  // Contact routes — auth + tenant required
  api.use('/contacts/*', authMiddleware, requireTenant);
  api.route('/contacts', contactRoutes(container));

  return api;
}
