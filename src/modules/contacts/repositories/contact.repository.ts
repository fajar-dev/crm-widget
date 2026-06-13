import type { DataSource, FindOptionsWhere } from 'typeorm';
import { BaseTenantRepository } from '../../../core/repositories/base.repository.ts';
import { Contact } from '../entities/contact.entity.ts';
import type { ContactStatus } from '../enums/contact.enum.ts';
import { ILike } from 'typeorm';

/**
 * Contact repository with tenant-scoped queries.
 */
export class ContactRepository extends BaseTenantRepository<Contact> {
  constructor(dataSource: DataSource, tenantId: string) {
    super(dataSource, Contact, tenantId);
  }

  /**
   * Search contacts by name, email, or company.
   */
  async search(
    searchTerm: string,
    page: number,
    perPage: number,
  ) {
    const where: FindOptionsWhere<Contact>[] = [
      this.tenantWhere({ firstName: ILike(`%${searchTerm}%`) } as any),
      this.tenantWhere({ lastName: ILike(`%${searchTerm}%`) } as any),
      this.tenantWhere({ email: ILike(`%${searchTerm}%`) } as any),
      this.tenantWhere({ company: ILike(`%${searchTerm}%`) } as any),
    ];

    const [data, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' } as any,
    });

    return { data, total };
  }

  /**
   * Find contacts by status.
   */
  async findByStatus(status: ContactStatus): Promise<Contact[]> {
    return this.findAll({
      where: { status } as any,
      order: { createdAt: 'DESC' } as any,
    });
  }
}
