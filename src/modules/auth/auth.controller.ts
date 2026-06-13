import type { AuthService } from './auth.service.ts';
import type { RegisterInput, LoginInput, RefreshTokenInput } from './validators/auth.validator.ts';
import { ApiResponse } from '../../core/helpers/response.ts';

export class AuthController {
  constructor(private readonly serviceFactory: (tenantId: string) => AuthService) {}

  async register(c: any) {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as RegisterInput;
    const service = this.serviceFactory(tenantId);
    const result = await service.register(tenantId, body);
    return ApiResponse.created(c, result, 'User registered successfully');
  }

  async login(c: any) {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as LoginInput;
    const service = this.serviceFactory(tenantId);
    const result = await service.login(tenantId, body);
    return ApiResponse.success(c, result, 'Login successful');
  }

  async refresh(c: any) {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as RefreshTokenInput;
    const service = this.serviceFactory(tenantId);
    const tokens = await service.refreshToken(tenantId, body.refreshToken);
    return ApiResponse.success(c, tokens, 'Token refreshed successfully');
  }

  async logout(c: any) {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as RefreshTokenInput;
    const service = this.serviceFactory(tenantId);
    await service.logout(tenantId, body.refreshToken);
    return ApiResponse.success(c, null, 'Logged out successfully');
  }

  async me(c: any) {
    const user = c.get('user');
    const service = this.serviceFactory(user.tenantId);
    const profile = await service.getProfile(user.tenantId, user.id);
    return ApiResponse.success(c, profile, 'Profile retrieved successfully');
  }
}
