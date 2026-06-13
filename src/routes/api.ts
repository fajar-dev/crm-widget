import { Hono } from 'hono';
import type { DataSource } from 'typeorm';
import { tenantMiddleware } from '../core/middlewares/tenant.middleware.ts';
import { Container } from '../container.ts';
import { authRoutes } from './api/auth.ts';
import { contactRoutes } from './api/contacts.ts';

export function createApiRouter(dataSource: DataSource) {
  const api = new Hono();
  const container = new Container(dataSource);

  api.use('/*', tenantMiddleware);

  api.route('/auth', authRoutes(container));
  api.route('/contacts', contactRoutes(container));

  return api;
}
