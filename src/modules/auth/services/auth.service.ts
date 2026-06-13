import { sign, verify } from 'hono/jwt';
import type { AuthTokens, IAuthService, RegisterInput, LoginInput } from '../interfaces/auth.interface.ts';
import type { JwtPayload } from '../interfaces/auth.interface.ts';
import type { UserRepository } from '../repositories/user.repository.ts';
import type { RefreshTokenRepository } from '../repositories/refresh-token.repository.ts';
import { AuthSerializer, type SerializedUser } from '../serializers/auth.serializer.ts';
import { UnauthorizedException, ConflictException } from '../../../core/exceptions/base.ts';
import { config } from '../../../config/config.ts';

/**
 * Authentication service handling user registration, login, and token management.
 */
export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tenantId: string,
  ) {}

  /**
   * Register a new user.
   */
  async register(
    tenantId: string,
    data: RegisterInput,
  ): Promise<{ user: SerializedUser; tokens: AuthTokens }> {
    // Check if email already exists in this tenant
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password using Bun's built-in password hashing
    const hashedPassword = await Bun.password.hash(data.password, {
      algorithm: 'bcrypt',
      cost: 12,
    });

    // Create user
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, tenantId, user.email, user.role);

    return {
      user: AuthSerializer.serialize(user),
      tokens,
    };
  }

  /**
   * Login with email and password.
   */
  async login(
    tenantId: string,
    data: LoginInput,
  ): Promise<{ user: SerializedUser; tokens: AuthTokens }> {
    // Find user with password field
    const user = await this.userRepository.findByEmailWithPassword(data.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isValid = await Bun.password.verify(data.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, tenantId, user.email, user.role);

    return {
      user: AuthSerializer.serialize(user),
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token.
   */
  async refreshToken(
    tenantId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    // Find valid refresh token
    const storedToken = await this.refreshTokenRepository.findValidToken(refreshToken);
    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Verify JWT
    try {
      const payload = await verify(refreshToken, config.JWT_SECRET, 'HS256') as unknown as JwtPayload;
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Revoke old refresh token
      await this.refreshTokenRepository.revoke(refreshToken);

      // Generate new tokens
      return this.generateTokens(payload.sub, tenantId, payload.email, payload.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout: revoke the refresh token.
   */
  async logout(
    tenantId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.refreshTokenRepository.revoke(refreshToken);
  }

  /**
   * Get user profile by ID.
   */
  async getProfile(
    tenantId: string,
    userId: string,
  ): Promise<SerializedUser> {
    const user = await this.userRepository.findByIdOrFail(userId, 'User');
    return AuthSerializer.serialize(user);
  }

  /**
   * Generate access and refresh token pair.
   */
  private async generateTokens(
    userId: string,
    tenantId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const now = Math.floor(Date.now() / 1000);

    // Access token (short-lived)
    const accessPayload: JwtPayload = {
      sub: userId,
      tenantId,
      email,
      role: role as any,
      type: 'access',
      iat: now,
      exp: now + this.parseExpiry(config.JWT_EXPIRES_IN),
    };

    // Refresh token (long-lived)
    const refreshPayload: JwtPayload = {
      sub: userId,
      tenantId,
      email,
      role: role as any,
      type: 'refresh',
      iat: now,
      exp: now + this.parseExpiry(config.JWT_REFRESH_EXPIRES_IN),
    };

    const accessToken = await sign({ ...accessPayload } as Record<string, unknown>, config.JWT_SECRET);
    const refreshToken = await sign({ ...refreshPayload } as Record<string, unknown>, config.JWT_SECRET);

    // Store refresh token in database
    const expiresAt = new Date((now + this.parseExpiry(config.JWT_REFRESH_EXPIRES_IN)) * 1000);
    await this.refreshTokenRepository.create({
      token: refreshToken,
      userId,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.JWT_EXPIRES_IN,
    };
  }

  /**
   * Parse expiry string (e.g., '15m', '7d', '1h') to seconds.
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1]!, 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}
