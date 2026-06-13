import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { config } from '../../config/config.ts';
import { UnauthorizedException, ForbiddenException } from '../exceptions/base.ts';
import type { JwtPayload, AuthUser } from '../interfaces/auth.interface.ts';
import { UserRole } from '../interfaces/auth.interface.ts';

/**
 * JWT authentication middleware.
 * Verifies Bearer token and injects authenticated user into Hono context.
 * Also overrides tenantId from JWT payload for security.
 */
export const authMiddleware = createMiddleware<{
  Variables: {
    tenantId: string;
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
      tenantId: payload.tenantId,
      email: payload.email,
      role: payload.role,
    });

    c.set('tenantId', payload.tenantId);

    await next();
  } catch (error) {
    if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
      throw error;
    }
    throw new UnauthorizedException('Invalid or expired token');
  }
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

    if (!roles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await next();
  });
}
