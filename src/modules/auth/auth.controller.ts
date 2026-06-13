import { Hono } from 'hono';
import type { AuthService } from './auth.service.ts';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validator.ts';
import type { RegisterInput, LoginInput, RefreshTokenInput } from './auth.validator.ts';
import { validate } from '../../core/helpers/validator.ts';
import { ApiResponse } from '../../core/helpers/response.ts';
import { authMiddleware } from '../../core/middlewares/auth.middleware.ts';

/**
 * Auth controller — class-based with constructor DI.
 * Routes are registered via registerRoutes().
 */
export class AuthController {
  public readonly router: Hono;

  constructor(private readonly serviceFactory: (tenantId: string) => AuthService) {
    this.router = new Hono();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.post('/register', validate('json', registerSchema), (c) => this.register(c));
    this.router.post('/login', validate('json', loginSchema), (c) => this.login(c));
    this.router.post('/refresh', validate('json', refreshTokenSchema), (c) => this.refresh(c));
    this.router.post('/logout', validate('json', refreshTokenSchema), (c) => this.logout(c));
    this.router.get('/me', authMiddleware, (c) => this.me(c));
  }

  private async register(c: any) {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as RegisterInput;
    const service = this.serviceFactory(tenantId);
    const result = await service.register(tenantId, body);
    return ApiResponse.created(c, result, 'User registered successfully');
  }

  private async login(c: any) {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as LoginInput;
    const service = this.serviceFactory(tenantId);
    const result = await service.login(tenantId, body);
    return ApiResponse.success(c, result, 'Login successful');
  }

  private async refresh(c: any) {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as RefreshTokenInput;
    const service = this.serviceFactory(tenantId);
    const tokens = await service.refreshToken(tenantId, body.refreshToken);
    return ApiResponse.success(c, tokens, 'Token refreshed successfully');
  }

  private async logout(c: any) {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as RefreshTokenInput;
    const service = this.serviceFactory(tenantId);
    await service.logout(tenantId, body.refreshToken);
    return ApiResponse.success(c, null, 'Logged out successfully');
  }

  private async me(c: any) {
    const user = c.get('user');
    const service = this.serviceFactory(user.tenantId);
    const profile = await service.getProfile(user.tenantId, user.id);
    return ApiResponse.success(c, profile, 'Profile retrieved successfully');
  }
}
