import type { DataSource } from 'typeorm';
import { BaseTenantRepository } from '../../../core/repositories/base.repository.ts';
import { User } from '../entities/user.entity.ts';

export class UserRepository extends BaseTenantRepository<User> {
  constructor(dataSource: DataSource, tenantId: string) {
    super(dataSource, User, tenantId);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .andWhere('user.tenant_id = :tenantId', { tenantId: this.tenantId })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email } as any);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.repository.update(
      { id: userId, tenantId: this.tenantId } as any,
      { lastLoginAt: new Date() } as any,
    );
  }
}
