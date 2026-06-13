import type { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity.ts';

/**
 * Refresh token repository.
 * Not extending BaseTenantRepository because RefreshToken
 * has its own tenantId handling.
 */
export class RefreshTokenRepository {
  private readonly repository: Repository<RefreshToken>;
  private readonly tenantId: string;

  constructor(dataSource: DataSource, tenantId: string) {
    this.repository = dataSource.getRepository(RefreshToken);
    this.tenantId = tenantId;
  }

  /**
   * Create and save a new refresh token.
   */
  async create(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    const refreshToken = this.repository.create({
      ...data,
      tenantId: this.tenantId,
    });
    return this.repository.save(refreshToken);
  }

  /**
   * Find a valid (non-revoked, non-expired) refresh token.
   */
  async findValidToken(token: string): Promise<RefreshToken | null> {
    return this.repository
      .createQueryBuilder('rt')
      .where('rt.token = :token', { token })
      .andWhere('rt.tenant_id = :tenantId', { tenantId: this.tenantId })
      .andWhere('rt.is_revoked = false')
      .andWhere('rt.expires_at > :now', { now: new Date() })
      .getOne();
  }

  /**
   * Revoke a specific refresh token.
   */
  async revoke(token: string): Promise<void> {
    await this.repository.update(
      { token, tenantId: this.tenantId } as any,
      { isRevoked: true } as any,
    );
  }

  /**
   * Revoke all refresh tokens for a user.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.repository.update(
      { userId, tenantId: this.tenantId } as any,
      { isRevoked: true } as any,
    );
  }
}
