import type { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity.ts';
import { MoreThan } from 'typeorm';

export class RefreshTokenRepository {
  private readonly repository: Repository<RefreshToken>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(RefreshToken);
  }

  async create(data: { token: string; userId: string; expiresAt: Date }): Promise<RefreshToken> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findValidToken(token: string): Promise<RefreshToken | null> {
    return this.repository.findOne({
      where: {
        token,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async revoke(token: string): Promise<void> {
    await this.repository.update({ token } as any, { isRevoked: true });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repository.update({ userId, isRevoked: false } as any, { isRevoked: true });
  }
}
