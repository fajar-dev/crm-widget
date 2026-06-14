import type { DataSource, Repository } from 'typeorm';
import { TenantInvitation } from '../entities/tenant-invitation.entity.ts';
import { IsNull } from 'typeorm';

export class TenantInvitationRepository {
  private readonly repository: Repository<TenantInvitation>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TenantInvitation);
  }

  async findByToken(token: string): Promise<TenantInvitation | null> {
    return this.repository.findOne({
      where: { token, acceptedAt: IsNull() },
      relations: ['tenant'],
    });
  }

  async findByEmailAndTenant(email: string, tenantId: string): Promise<TenantInvitation | null> {
    return this.repository.findOne({
      where: { email, tenantId, acceptedAt: IsNull() },
    });
  }

  async findAllByTenant(tenantId: string): Promise<TenantInvitation[]> {
    return this.repository.find({
      where: { tenantId, acceptedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<TenantInvitation>): Promise<TenantInvitation> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async markAccepted(id: string): Promise<void> {
    await this.repository.update(id, { acceptedAt: new Date() } as any);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
