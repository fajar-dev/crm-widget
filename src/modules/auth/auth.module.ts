import type { Container } from '../../container.ts';
import { AuthController } from './auth.controller.ts';

export function createAuthModule(container: Container): AuthController {
  return new AuthController(container.authService());
}
