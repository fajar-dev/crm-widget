import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { config } from '../../config/config.ts';
import { UnauthorizedException, ForbiddenException } from '../exceptions/base.ts';
import type { JwtPayload, AuthUser } from '../interfaces/auth.interface.ts';
import { UserRole } from '../interfaces/auth.interface.ts';

/**
 * JWT authentication middleware.
 * Verifies Bearer token and injects authenticated user into Hono context.
 * Supports nullable tenantId/tenantSlug/role for users without a tenant.
 */
export const authMiddleware = createMiddleware<{
  Variables: {
    tenantId: string;
    tenantSlug: string;
    user: AuthUser;
  };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Authorization header with Bearer token is required');
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, config.JWT_SECRET, 'HS256') as unknown as JwtPayload;

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    c.set('user', {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      tenantSlug: payload.tenantSlug,
      role: payload.role,
    });

    if (payload.tenantId) {
      c.set('tenantId', payload.tenantId);
    }
    if (payload.tenantSlug) {
      c.set('tenantSlug', payload.tenantSlug);
    }

    await next();
  } catch (error) {
    if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
      throw error;
    }
    throw new UnauthorizedException('Invalid or expired token');
  }
});

/**
 * Middleware that requires a tenant context in the JWT.
 * Use after authMiddleware for tenant-scoped routes.
 */
export const requireTenant = createMiddleware<{
  Variables: {
    tenantId: string;
    tenantSlug: string;
    user: AuthUser;
  };
}>(async (c, next) => {
  const user = c.get('user');
  if (!user || !user.tenantId || !user.tenantSlug) {
    throw new ForbiddenException('Tenant context is required. Please select or create a tenant first.');
  }
  await next();
});

/**
 * Role-based authorization middleware factory.
 * Use after authMiddleware to restrict access by role.
 */
export function requireRole(...roles: UserRole[]) {
  return createMiddleware<{
    Variables: {
      user: AuthUser;
    };
  }>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!user.role || !roles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await next();
  });
}
