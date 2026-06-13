import { Hono } from 'hono';
import type { DataSource } from 'typeorm';
import { tenantMiddleware } from '../core/middlewares/tenant.middleware.ts';
import { Container } from '../container.ts';
import { createAuthModule } from '../modules/auth/auth.module.ts';
import { createContactModule } from '../modules/contacts/contact.module.ts';

/**
 * Creates the main API router with all module routes.
 * Uses the DI Container to wire dependencies.
 *
 * @param dataSource - TypeORM DataSource
 * @returns Configured Hono app
 */
export function createApiRouter(dataSource: DataSource) {
  const api = new Hono();
  const container = new Container(dataSource);

  // Apply tenant resolution middleware to all API routes
  api.use('/*', tenantMiddleware);

  // Mount module routes
  api.route('/auth', createAuthModule(container));
  api.route('/contacts', createContactModule(container));

  // Add more modules here:
  // api.route('/deals', createDealModule(container));
  // api.route('/tasks', createTaskModule(container));
  // api.route('/companies', createCompanyModule(container));

  return api;
}
