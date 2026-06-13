# Module Template

Copy-paste templates for creating a new module. Replace `Example`/`example` with your module name.

## enums/example.enum.ts

```typescript
export enum ExampleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
```

## entities/example.entity.ts

```typescript
import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from '../../../core/interfaces/tenant-aware.interface.ts';
import { ExampleStatus } from '../enums/example.enum.ts';

@Entity('examples')
export class Example extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'enum', enum: ExampleStatus, default: ExampleStatus.ACTIVE })
  status!: ExampleStatus;
}
```

## interfaces/example.interface.ts

```typescript
import type { SerializedExample } from '../serializers/example.serializer.ts';
import type { PaginationQuery } from '../../../core/validators/pagination.schema.ts';

export interface IExampleService {
  findAll(tenantId: string, query: PaginationQuery): Promise<{ data: SerializedExample[]; total: number }>;
  findById(tenantId: string, id: string): Promise<SerializedExample>;
  create(tenantId: string, data: CreateExampleInput): Promise<SerializedExample>;
  update(tenantId: string, id: string, data: UpdateExampleInput): Promise<SerializedExample>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface CreateExampleInput {
  name: string;
  status?: ExampleStatus;
}

export interface UpdateExampleInput {
  name?: string;
  status?: ExampleStatus;
}
```

## validators/example.validator.ts

```typescript
import { z } from 'zod';
import { ExampleStatus } from '../enums/example.enum.ts';

export const createExampleSchema = z.object({
  name: z.string().min(1).max(200),
  status: z.nativeEnum(ExampleStatus).optional().default(ExampleStatus.ACTIVE),
});

export const updateExampleSchema = createExampleSchema.partial();

export type CreateExampleInput = z.infer<typeof createExampleSchema>;
export type UpdateExampleInput = z.infer<typeof updateExampleSchema>;
```

## repositories/example.repository.ts

```typescript
import type { DataSource } from 'typeorm';
import { BaseTenantRepository } from '../../../core/repositories/base.repository.ts';
import { Example } from '../entities/example.entity.ts';

export class ExampleRepository extends BaseTenantRepository<Example> {
  constructor(dataSource: DataSource, tenantId: string) {
    super(dataSource, Example, tenantId);
  }
}
```

## serializers/example.serializer.ts

```typescript
import type { Example } from '../entities/example.entity.ts';

export interface SerializedExample {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class ExampleSerializer {
  static serialize(entity: Example): SerializedExample {
    return {
      id: entity.id,
      name: entity.name,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static serializeMany(entities: Example[]): SerializedExample[] {
    return entities.map(ExampleSerializer.serialize);
  }
}
```

## example.service.ts

```typescript
import type { IExampleService } from './interfaces/example.interface.ts';
import type { ExampleRepository } from './repositories/example.repository.ts';
import { ExampleSerializer, type SerializedExample } from './serializers/example.serializer.ts';
import type { PaginationQuery } from '../../core/validators/pagination.schema.ts';
import type { CreateExampleInput, UpdateExampleInput } from './validators/example.validator.ts';

export class ExampleService implements IExampleService {
  constructor(private readonly repository: ExampleRepository) {}

  async findAll(_tenantId: string, query: PaginationQuery) {
    const result = await this.repository.paginate(query.page, query.perPage, {
      order: { [query.sortBy]: query.sortOrder } as any,
    });
    return { data: ExampleSerializer.serializeMany(result.data), total: result.total };
  }

  async findById(_tenantId: string, id: string): Promise<SerializedExample> {
    const entity = await this.repository.findByIdOrFail(id, 'Example');
    return ExampleSerializer.serialize(entity);
  }

  async create(_tenantId: string, data: CreateExampleInput): Promise<SerializedExample> {
    const entity = await this.repository.create(data);
    return ExampleSerializer.serialize(entity);
  }

  async update(_tenantId: string, id: string, data: UpdateExampleInput): Promise<SerializedExample> {
    const entity = await this.repository.update(id, data, 'Example');
    return ExampleSerializer.serialize(entity);
  }

  async delete(_tenantId: string, id: string): Promise<void> {
    await this.repository.delete(id, 'Example');
  }
}
```

## example.controller.ts

```typescript
import { Hono } from 'hono';
import type { ExampleService } from './example.service.ts';
import { createExampleSchema, updateExampleSchema } from './validators/example.validator.ts';
import type { CreateExampleInput, UpdateExampleInput } from './validators/example.validator.ts';
import { paginationSchema, type PaginationQuery } from '../../core/validators/pagination.schema.ts';
import { validate } from '../../core/helpers/validator.ts';
import { ApiResponse } from '../../core/helpers/response.ts';
import { authMiddleware } from '../../core/middlewares/auth.middleware.ts';

export class ExampleController {
  public readonly router: Hono;

  constructor(private readonly serviceFactory: (tenantId: string) => ExampleService) {
    this.router = new Hono();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.use('/*', authMiddleware);
    this.router.get('/', validate('query', paginationSchema), (c) => this.index(c));
    this.router.get('/:id', (c) => this.show(c));
    this.router.post('/', validate('json', createExampleSchema), (c) => this.store(c));
    this.router.put('/:id', validate('json', updateExampleSchema), (c) => this.update(c));
    this.router.delete('/:id', (c) => this.destroy(c));
  }

  private async index(c: any) {
    const tenantId = c.get('tenantId');
    const query = c.req.valid('query') as PaginationQuery;
    const service = this.serviceFactory(tenantId);
    const result = await service.findAll(tenantId, query);
    return ApiResponse.paginated(c, result.data, result.total, query.page, query.perPage);
  }

  private async show(c: any) {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const service = this.serviceFactory(tenantId);
    const entity = await service.findById(tenantId, id);
    return ApiResponse.success(c, entity);
  }

  private async store(c: any) {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as CreateExampleInput;
    const service = this.serviceFactory(tenantId);
    const entity = await service.create(tenantId, body);
    return ApiResponse.created(c, entity, 'Example created successfully');
  }

  private async update(c: any) {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = c.req.valid('json') as UpdateExampleInput;
    const service = this.serviceFactory(tenantId);
    const entity = await service.update(tenantId, id, body);
    return ApiResponse.success(c, entity, 'Example updated successfully');
  }

  private async destroy(c: any) {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const service = this.serviceFactory(tenantId);
    await service.delete(tenantId, id);
    return ApiResponse.success(c, null, 'Example deleted successfully');
  }
}
```

## example.module.ts

```typescript
import type { Container } from '../../container.ts';
import { ExampleController } from './example.controller.ts';

export function createExampleModule(container: Container) {
  const controller = new ExampleController(
    (tenantId) => container.exampleService(tenantId)
  );
  return controller.router;
}
```
