import type { DataSource, Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity.ts';

export class TenantRepository {
  private readonly repository: Repository<Tenant>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Tenant);
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.repository.findOneBy({ id });
  }

  async findByIdOrFail(id: string): Promise<Tenant> {
    const tenant = await this.repository.findOneBy({ id });
    if (!tenant) throw new Error('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.repository.findOneBy({ slug });
  }

  async findByCode(code: string): Promise<Tenant | null> {
    return this.repository.findOneBy({ code });
  }

  async create(data: Partial<Tenant>): Promise<Tenant> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    await this.repository.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
