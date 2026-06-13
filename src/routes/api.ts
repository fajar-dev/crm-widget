import { OpenAPIHono } from '@hono/zod-openapi';
import type { DataSource } from 'typeorm';
import { tenantMiddleware } from '../core/middlewares/tenant.middleware.ts';
import { createAuthModule } from '../modules/auth/auth.module.ts';
import { createContactModule } from '../modules/contacts/contact.module.ts';

/**
 * Creates the main API router with all module routes.
 * Applies tenant middleware to all routes.
 *
 * @param dataSource - TypeORM DataSource
 * @returns Configured OpenAPIHono app
 */
export function createApiRouter(dataSource: DataSource) {
  const api = new OpenAPIHono();

  // Apply tenant resolution middleware to all API routes
  api.use('/*', tenantMiddleware);

  // Mount module routes
  api.route('/auth', createAuthModule(dataSource));
  api.route('/contacts', createContactModule(dataSource));

  // Add more modules here:
  // api.route('/deals', createDealModule(dataSource));
  // api.route('/tasks', createTaskModule(dataSource));
  // api.route('/companies', createCompanyModule(dataSource));

  return api;
}
