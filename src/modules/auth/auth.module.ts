import type { Container } from '../../container.ts';
import { AuthController } from './auth.controller.ts';

/**
 * Creates the Auth module.
 * Wires the AuthController with the Container's authService factory.
 */
export function createAuthModule(container: Container) {
  const controller = new AuthController((tenantId) => container.authService(tenantId));
  return controller.router;
}
