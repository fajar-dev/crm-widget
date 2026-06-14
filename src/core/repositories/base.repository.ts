import type { DataSource, Repository, DeepPartial, FindOptionsWhere, FindManyOptions, ObjectLiteral } from 'typeorm';
import { NotFoundException } from '../exceptions/base.ts';
import type { BaseEntity } from '../interfaces/base.entity.ts';

/**
 * Pagination result interface.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

/**
 * Base repository for all entities.
 * Provides common CRUD operations.
 *
 * Usage:
 * ```typescript
 * class ContactRepository extends BaseRepository<Contact> {
 *   constructor(dataSource: DataSource) {
 *     super(dataSource, Contact);
 *   }
 * }
 * ```
 */
export class BaseRepository<T extends BaseEntity & ObjectLiteral> {
  protected readonly repository: Repository<T>;

  constructor(
    dataSource: DataSource,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entity: new () => T,
  ) {
    this.repository = dataSource.getRepository(entity);
  }

  /**
   * Find all entities.
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  /**
   * Find entity by ID.
   */
  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
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
   * Find one entity matching criteria.
   */
  async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where });
  }

  /**
   * Create and save a new entity.
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Update an existing entity by ID.
   */
  async update(id: string, data: DeepPartial<T>, entityName = 'Resource'): Promise<T> {
    const entity = await this.findByIdOrFail(id, entityName);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  /**
   * Delete an entity by ID.
   */
  async delete(id: string, entityName = 'Resource'): Promise<void> {
    await this.findByIdOrFail(id, entityName);
    await this.repository.delete(id);
  }

  /**
   * Paginated find.
   */
  async paginate(
    page: number,
    perPage: number,
    options?: Omit<FindManyOptions<T>, 'skip' | 'take'>,
  ): Promise<PaginatedResult<T>> {
    const [data, total] = await this.repository.findAndCount({
      ...options,
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return { data, total };
  }

  /**
   * Count entities.
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where });
  }
}
