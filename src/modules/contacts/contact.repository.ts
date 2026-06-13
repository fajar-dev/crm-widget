import type { DataSource } from 'typeorm';
import { BaseTenantRepository, type PaginatedResult } from '../../core/repositories/base.repository.ts';
import { Contact } from './contact.entity.ts';
import type { ContactStatus } from './contact.enum.ts';

export class ContactRepository extends BaseTenantRepository<Contact> {
  constructor(dataSource: DataSource, tenantId: string) {
    super(dataSource, Contact, tenantId);
  }

  async search(searchTerm: string, page: number, perPage: number): Promise<PaginatedResult<Contact>> {
    const qb = this.repository
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId: this.tenantId })
      .andWhere(
        '(c.first_name ILIKE :search OR c.last_name ILIKE :search OR c.email ILIKE :search OR c.company ILIKE :search)',
        { search: `%${searchTerm}%` },
      )
      .skip((page - 1) * perPage)
      .take(perPage)
      .orderBy('c.created_at', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findByStatus(status: ContactStatus): Promise<Contact[]> {
    return this.findAll({ where: { status } as any });
  }
}
