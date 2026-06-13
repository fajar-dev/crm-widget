import type { DataSource, Repository, DeepPartial, FindOptionsWhere, FindManyOptions, ObjectLiteral } from 'typeorm';
import type { TenantAwareEntity } from '../interfaces/tenant-aware.interface.ts';
import { NotFoundException } from '../exceptions/base.ts';

/**
 * Pagination result interface.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

/**
 * Base repository for tenant-aware entities.
 * Automatically scopes ALL queries to the current tenant.
 *
 * Usage:
 * ```typescript
 * class ContactRepository extends BaseTenantRepository<Contact> {
 *   constructor(dataSource: DataSource, tenantId: string) {
 *     super(dataSource, Contact, tenantId);
 *   }
 * }
 * ```
 */
export class BaseTenantRepository<T extends TenantAwareEntity & ObjectLiteral> {
  protected readonly repository: Repository<T>;
  protected readonly tenantId: string;

  constructor(
    dataSource: DataSource,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entity: new () => T,
    tenantId: string,
  ) {
    this.repository = dataSource.getRepository(entity);
    this.tenantId = tenantId;
  }

  /**
   * Build a where clause that always includes tenant_id filter.
   */
  protected tenantWhere(where?: FindOptionsWhere<T>): FindOptionsWhere<T> {
    return {
      ...where,
      tenantId: this.tenantId,
    } as FindOptionsWhere<T>;
  }

  /**
   * Find all entities for the current tenant.
   */
  async findAll(options?: Omit<FindManyOptions<T>, 'where'> & { where?: FindOptionsWhere<T> }): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: this.tenantWhere(options?.where),
    });
  }

  /**
   * Find entity by ID (scoped to tenant).
   */
  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: this.tenantWhere({ id } as any),
    });
  }

  /**
   * Find entity by ID or throw NotFoundException.
   */
  async findByIdOrFail(id: string, entityName = 'Resource'): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(`${entityName} with id '${id}' not found`);
    }
    return entity;
  }

  /**
   * Find one entity matching criteria (scoped to tenant).
   */
  async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({
      where: this.tenantWhere(where),
    });
  }

  /**
   * Create and save a new entity (auto-sets tenantId).
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create({
      ...data,
      tenantId: this.tenantId,
    } as DeepPartial<T>);
    return this.repository.save(entity);
  }

  /**
   * Update an existing entity by ID (scoped to tenant).
   */
  async update(id: string, data: DeepPartial<T>, entityName = 'Resource'): Promise<T> {
    const entity = await this.findByIdOrFail(id, entityName);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  /**
   * Soft delete or hard delete an entity by ID (scoped to tenant).
   */
  async delete(id: string, entityName = 'Resource'): Promise<void> {
    await this.findByIdOrFail(id, entityName);
    await this.repository.delete({ id, tenantId: this.tenantId } as any);
  }

  /**
   * Paginated find with tenant scoping.
   */
  async paginate(
    page: number,
    perPage: number,
    options?: Omit<FindManyOptions<T>, 'where' | 'skip' | 'take'> & { where?: FindOptionsWhere<T> },
  ): Promise<PaginatedResult<T>> {
    const [data, total] = await this.repository.findAndCount({
      ...options,
      where: this.tenantWhere(options?.where),
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return { data, total };
  }

  /**
   * Count entities (scoped to tenant).
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({
      where: this.tenantWhere(where),
    });
  }
}
