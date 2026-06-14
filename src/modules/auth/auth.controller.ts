import type { AuthService } from './auth.service.ts';
import type { RegisterInput, LoginInput, RefreshTokenInput, SwitchTenantInput } from './validators/auth.validator.ts';
import { ApiResponse } from '../../core/helpers/response.ts';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  async register(c: any) {
    const body = c.req.valid('json') as RegisterInput;
    const result = await this.service.register(body);
    return ApiResponse.created(c, result, 'User registered successfully');
  }

  async login(c: any) {
    const body = c.req.valid('json') as LoginInput;
    const result = await this.service.login(body);
    return ApiResponse.success(c, result, 'Login successful');
  }

  async refresh(c: any) {
    const body = c.req.valid('json') as RefreshTokenInput;
    const tokens = await this.service.refreshToken(body.refreshToken);
    return ApiResponse.success(c, tokens, 'Token refreshed successfully');
  }

  async logout(c: any) {
    const body = c.req.valid('json') as RefreshTokenInput;
    await this.service.logout(body.refreshToken);
    return ApiResponse.success(c, null, 'Logged out successfully');
  }

  async me(c: any) {
    const user = c.get('user');
    const profile = await this.service.getProfile(user.id);
    return ApiResponse.success(c, profile);
  }

  async switchTenant(c: any) {
    const user = c.get('user');
    const body = c.req.valid('json') as SwitchTenantInput;
    const result = await this.service.switchTenant(user.id, body.tenantId);
    return ApiResponse.success(c, result, 'Tenant switched successfully');
  }
}
