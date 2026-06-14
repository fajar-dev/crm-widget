import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createAuthModule } from '../../modules/auth/auth.module.ts';
import { registerSchema, loginSchema, refreshTokenSchema, switchTenantSchema } from '../../modules/auth/validators/auth.validator.ts';
import { validate } from '../../core/helpers/validator.ts';
import { authMiddleware } from '../../core/middlewares/auth.middleware.ts';

export function authRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createAuthModule(container);

  // Public routes
  router.post('/register', validate('json', registerSchema), (c) => controller.register(c));
  router.post('/login', validate('json', loginSchema), (c) => controller.login(c));
  router.post('/refresh', validate('json', refreshTokenSchema), (c) => controller.refresh(c));
  router.post('/logout', validate('json', refreshTokenSchema), (c) => controller.logout(c));

  // Authenticated routes
  router.get('/me', authMiddleware, (c) => controller.me(c));
  router.post('/switch-tenant', authMiddleware, validate('json', switchTenantSchema), (c) => controller.switchTenant(c));

  return router;
}
