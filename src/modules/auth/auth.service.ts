import { sign, verify } from 'hono/jwt';
import type { JwtPayload } from '../../core/interfaces/auth.interface.ts';
import { UserRole } from '../../core/interfaces/auth.interface.ts';
import type { AuthTokens, IAuthService, RegisterInput, LoginInput } from './interfaces/auth.interface.ts';
import type { UserRepository } from '../user/repositories/user.repository.ts';
import type { RefreshTokenRepository } from './repositories/refresh-token.repository.ts';
import type { UserTenantRepository } from '../tenant/repositories/user-tenant.repository.ts';
import type { TenantRepository } from '../tenant/repositories/tenant.repository.ts';
import { UserSerializer, type SerializedUser } from '../user/serializers/user.serializer.ts';
import { TenantSerializer, type SerializedTenant } from '../tenant/serializers/tenant.serializer.ts';
import { UnauthorizedException, ConflictException, ForbiddenException, NotFoundException } from '../../core/exceptions/base.ts';
import { config } from '../../config/config.ts';

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly userTenantRepository: UserTenantRepository,
    private readonly tenantRepository: TenantRepository,
  ) {}

  async register(data: RegisterInput): Promise<{ user: SerializedUser; tokens: AuthTokens }> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) throw new ConflictException('Email already registered');

    const hashedPassword = await Bun.password.hash(data.password, { algorithm: 'bcrypt', cost: 12 });
    const user = await this.userRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
    });

    const tokens = await this.generateTokens(user.id, user.email, null, null);
    return { user: UserSerializer.serialize(user), tokens };
  }

  async login(data: LoginInput): Promise<{ user: SerializedUser; tenants: SerializedTenant[]; activeTenant: SerializedTenant | null; tokens: AuthTokens }> {
    const user = await this.userRepository.findByEmailWithPassword(data.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const isValid = await Bun.password.verify(data.password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    await this.userRepository.updateLastLogin(user.id);

    const memberships = await this.userTenantRepository.findAllByUser(user.id);
    const tenants = memberships.map((m) => TenantSerializer.serialize(m.tenant, m.role));

    let activeTenant: SerializedTenant | null = null;
    let tenantId: string | null = null;
    let role: UserRole | null = null;

    if (memberships.length > 0) {
      const lastActive = user.lastActiveTenantId
        ? memberships.find((m) => m.tenantId === user.lastActiveTenantId)
        : null;
      const active = lastActive || memberships[0]!;
      activeTenant = TenantSerializer.serialize(active.tenant, active.role);
      tenantId = active.tenantId;
      role = active.role;

      await this.userRepository.updateLastActiveTenant(user.id, active.tenantId);
    }

    const tokens = await this.generateTokens(user.id, user.email, tenantId, role);
    return { user: UserSerializer.serialize(user), tenants, activeTenant, tokens };
  }

  async switchTenant(userId: string, tenantId: string): Promise<{ activeTenant: SerializedTenant; tokens: AuthTokens }> {
    const membership = await this.userTenantRepository.findByUserAndTenant(userId, tenantId);
    if (!membership) throw new ForbiddenException('Not a member of this tenant');

    const user = await this.userRepository.findByIdOrFail(userId);
    await this.userRepository.updateLastActiveTenant(userId, tenantId);

    const activeTenant = TenantSerializer.serialize(membership.tenant, membership.role);
    const tokens = await this.generateTokens(userId, user.email, tenantId, membership.role);

    return { activeTenant, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const storedToken = await this.refreshTokenRepository.findValidToken(refreshToken);
    if (!storedToken) throw new UnauthorizedException('Invalid or expired refresh token');

    try {
      const payload = await verify(refreshToken, config.JWT_SECRET, 'HS256') as unknown as JwtPayload;
      if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token type');

      await this.refreshTokenRepository.revoke(refreshToken);
      return this.generateTokens(payload.sub, payload.email, payload.tenantId, payload.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(_refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.revoke(_refreshToken);
  }

  async getProfile(userId: string): Promise<{ user: SerializedUser; activeTenant: SerializedTenant | null; tenants: SerializedTenant[] }> {
    const user = await this.userRepository.findByIdOrFail(userId);
    const memberships = await this.userTenantRepository.findAllByUser(userId);
    const tenants = memberships.map((m) => TenantSerializer.serialize(m.tenant, m.role));

    let activeTenant: SerializedTenant | null = null;
    if (user.lastActiveTenantId) {
      const active = memberships.find((m) => m.tenantId === user.lastActiveTenantId);
      if (active) activeTenant = TenantSerializer.serialize(active.tenant, active.role);
    }

    return { user: UserSerializer.serialize(user), activeTenant, tenants };
  }

  private async generateTokens(userId: string, email: string, tenantId: string | null, role: UserRole | null): Promise<AuthTokens> {
    const now = Math.floor(Date.now() / 1000);

    const accessPayload = {
      sub: userId, email, tenantId, role, type: 'access',
      iat: now, exp: now + this.parseExpiry(config.JWT_EXPIRES_IN),
    };

    const refreshPayload = {
      sub: userId, email, tenantId, role, type: 'refresh',
      iat: now, exp: now + this.parseExpiry(config.JWT_REFRESH_EXPIRES_IN),
    };

    const accessToken = await sign(accessPayload as Record<string, unknown>, config.JWT_SECRET);
    const refreshTokenStr = await sign(refreshPayload as Record<string, unknown>, config.JWT_SECRET);

    const expiresAt = new Date((now + this.parseExpiry(config.JWT_REFRESH_EXPIRES_IN)) * 1000);
    await this.refreshTokenRepository.create({ token: refreshTokenStr, userId, expiresAt });

    return { accessToken, refreshToken: refreshTokenStr, expiresIn: config.JWT_EXPIRES_IN };
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1]!, 10);
    switch (match[2]) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}
