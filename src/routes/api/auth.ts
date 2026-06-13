import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { AuthController } from '../../modules/auth/auth.controller.ts';
import { registerSchema, loginSchema, refreshTokenSchema } from '../../modules/auth/validators/auth.validator.ts';
import { validate } from '../../core/helpers/validator.ts';
import { authMiddleware } from '../../core/middlewares/auth.middleware.ts';

export function authRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = new AuthController((tenantId) => container.authService(tenantId));

  router.post('/register', validate('json', registerSchema), (c) => controller.register(c));
  router.post('/login', validate('json', loginSchema), (c) => controller.login(c));
  router.post('/refresh', validate('json', refreshTokenSchema), (c) => controller.refresh(c));
  router.post('/logout', validate('json', refreshTokenSchema), (c) => controller.logout(c));
  router.get('/me', authMiddleware, (c) => controller.me(c));

  return router;
}
