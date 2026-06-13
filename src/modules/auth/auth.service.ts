import { sign, verify } from 'hono/jwt';
import type { JwtPayload } from '../../core/interfaces/auth.interface.ts';
import type { AuthTokens, IAuthService, RegisterInput, LoginInput } from './interfaces/auth.interface.ts';
import type { UserRepository } from '../user/repositories/user.repository.ts';
import type { RefreshTokenRepository } from './repositories/refresh-token.repository.ts';
import { UserSerializer, type SerializedUser } from '../user/serializers/user.serializer.ts';
import { UnauthorizedException, ConflictException } from '../../core/exceptions/base.ts';
import { config } from '../../config/config.ts';

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tenantId: string,
  ) {}

  async register(tenantId: string, data: RegisterInput): Promise<{ user: SerializedUser; tokens: AuthTokens }> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await Bun.password.hash(data.password, { algorithm: 'bcrypt', cost: 12 });
    const user = await this.userRepository.create({ ...data, password: hashedPassword });
    const tokens = await this.generateTokens(user.id, tenantId, user.email, user.role);

    return { user: UserSerializer.serialize(user), tokens };
  }

  async login(tenantId: string, data: LoginInput): Promise<{ user: SerializedUser; tokens: AuthTokens }> {
    const user = await this.userRepository.findByEmailWithPassword(data.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const isValid = await Bun.password.verify(data.password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    await this.userRepository.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user.id, tenantId, user.email, user.role);

    return { user: UserSerializer.serialize(user), tokens };
  }

  async refreshToken(tenantId: string, refreshToken: string): Promise<AuthTokens> {
    const storedToken = await this.refreshTokenRepository.findValidToken(refreshToken);
    if (!storedToken) throw new UnauthorizedException('Invalid or expired refresh token');

    try {
      const payload = await verify(refreshToken, config.JWT_SECRET, 'HS256') as unknown as JwtPayload;
      if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token type');

      await this.refreshTokenRepository.revoke(refreshToken);
      return this.generateTokens(payload.sub, tenantId, payload.email, payload.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(_tenantId: string, refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.revoke(refreshToken);
  }

  async getProfile(_tenantId: string, userId: string): Promise<SerializedUser> {
    const user = await this.userRepository.findByIdOrFail(userId, 'User');
    return UserSerializer.serialize(user);
  }

  private async generateTokens(userId: string, tenantId: string, email: string, role: string): Promise<AuthTokens> {
    const now = Math.floor(Date.now() / 1000);

    const accessPayload = {
      sub: userId, tenantId, email, role, type: 'access',
      iat: now, exp: now + this.parseExpiry(config.JWT_EXPIRES_IN),
    };

    const refreshPayload = {
      sub: userId, tenantId, email, role, type: 'refresh',
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
