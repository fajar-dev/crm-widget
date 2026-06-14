import type { DataSource, Repository } from 'typeorm';
import { UserTenant } from '../entities/user-tenant.entity.ts';
import { MembershipStatus } from '../enums/tenant.enum.ts';

export class UserTenantRepository {
  private readonly repository: Repository<UserTenant>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserTenant);
  }

  async findByUserAndTenant(userId: string, tenantId: string): Promise<UserTenant | null> {
    return this.repository.findOne({
      where: { userId, tenantId },
      relations: ['tenant'],
    });
  }

  async findAllByUser(userId: string): Promise<UserTenant[]> {
    return this.repository.find({
      where: { userId, status: MembershipStatus.ACTIVE },
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByTenant(tenantId: string): Promise<UserTenant[]> {
    return this.repository.find({
      where: { tenantId, status: MembershipStatus.ACTIVE },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(data: Partial<UserTenant>): Promise<UserTenant> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async updateRole(userId: string, tenantId: string, data: Partial<UserTenant>): Promise<UserTenant> {
    await this.repository.update({ userId, tenantId } as any, data as any);
    const updated = await this.findByUserAndTenant(userId, tenantId);
    if (!updated) throw new Error('Membership not found');
    return updated;
  }

  async remove(userId: string, tenantId: string): Promise<void> {
    await this.repository.delete({ userId, tenantId } as any);
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.repository.count({ where: { tenantId, status: MembershipStatus.ACTIVE } });
  }
}
