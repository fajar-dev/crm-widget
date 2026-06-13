import { createMiddleware } from 'hono/factory';
import { BadRequestException } from '../exceptions/base.ts';

/** UUID v4 regex pattern for tenant ID validation */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Tenant resolution middleware.
 * Reads X-Tenant-ID from request headers, validates format,
 * and injects tenantId into Hono context.
 *
 * All routes under /api/* MUST have this middleware applied.
 */
export const tenantMiddleware = createMiddleware<{
  Variables: {
    tenantId: string;
  };
}>(async (c, next) => {
  const tenantId = c.req.header('X-Tenant-ID');

  if (!tenantId) {
    throw new BadRequestException('X-Tenant-ID header is required');
  }

  if (!UUID_REGEX.test(tenantId)) {
    throw new BadRequestException('X-Tenant-ID must be a valid UUID');
  }

  c.set('tenantId', tenantId);
  await next();
});
