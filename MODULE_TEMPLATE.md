# Module Template

Copy-paste template for creating a new module. Replace all occurrences:
- `__name__` → module name lowercase (e.g., `deal`)
- `__Name__` → module name PascalCase (e.g., `Deal`)
- `__names__` → module name plural lowercase (e.g., `deals`)
- `__Names__` → module name plural PascalCase (e.g., `Deals`)

---

## 1. Entity: `src/modules/__names__/entities/__name__.entity.ts`

```typescript
import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from '../../../core/interfaces/tenant-aware.interface.ts';

/**
 * __Name__ entity.
 */
@Entity('__names__')
export class __Name__ extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  // Add more columns as needed
  // @Column({ type: 'varchar', length: 500, nullable: true })
  // description?: string;
}
```

## 2. Enum: `src/modules/__names__/enums/__name__.enum.ts`

```typescript
/**
 * __Name__ status values.
 */
export enum __Name__Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
```

## 3. Interface: `src/modules/__names__/interfaces/__name__.interface.ts`

```typescript
import type { PaginatedResult } from '../../../core/repositories/base.repository.ts';
import type { PaginationQuery } from '../../../core/validators/pagination.schema.ts';
import type { __Name__ } from '../entities/__name__.entity.ts';

export interface I__Name__Service {
  findAll(tenantId: string, query: PaginationQuery): Promise<PaginatedResult<any>>;
  findById(tenantId: string, id: string): Promise<any>;
  create(tenantId: string, data: Create__Name__Input): Promise<any>;
  update(tenantId: string, id: string, data: Update__Name__Input): Promise<any>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface Create__Name__Input {
  title: string;
  // Add more fields
}

export interface Update__Name__Input {
  title?: string;
  // Add more fields
}
```

## 4. Validators: `src/modules/__names__/validators/__name__.validators.ts`

```typescript
import { z } from 'zod';

export const create__Name__Schema = z.object({
  title: z.string().min(1).max(200).openapi({
    description: '__Name__ title',
    example: 'Example __Name__',
  }),
  // Add more fields
}).openapi('Create__Name__Request');

export const update__Name__Schema = create__Name__Schema.partial().openapi('Update__Name__Request');

export const __name__ResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('__Name__Response');

export type Create__Name__Input = z.infer<typeof create__Name__Schema>;
export type Update__Name__Input = z.infer<typeof update__Name__Schema>;
```

## 5. Repository: `src/modules/__names__/repositories/__name__.repository.ts`

```typescript
import type { DataSource } from 'typeorm';
import { BaseTenantRepository } from '../../../core/repositories/base.repository.ts';
import { __Name__ } from '../entities/__name__.entity.ts';

export class __Name__Repository extends BaseTenantRepository<__Name__> {
  constructor(dataSource: DataSource, tenantId: string) {
    super(dataSource, __Name__, tenantId);
  }

  // Add custom query methods here
}
```

## 6. Serializer: `src/modules/__names__/serializers/__name__.serializer.ts`

```typescript
import type { __Name__ } from '../entities/__name__.entity.ts';

export interface Serialized__Name__ {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export class __Name__Serializer {
  static serialize(entity: __Name__): Serialized__Name__ {
    return {
      id: entity.id,
      title: entity.title,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static serializeMany(entities: __Name__[]): Serialized__Name__[] {
    return entities.map(__Name__Serializer.serialize);
  }
}
```

## 7. Service: `src/modules/__names__/services/__name__.service.ts`

```typescript
import type { I__Name__Service, Create__Name__Input, Update__Name__Input } from '../interfaces/__name__.interface.ts';
import type { __Name__Repository } from '../repositories/__name__.repository.ts';
import { __Name__Serializer } from '../serializers/__name__.serializer.ts';
import type { PaginationQuery } from '../../../core/validators/pagination.schema.ts';

export class __Name__Service implements I__Name__Service {
  constructor(private readonly repository: __Name__Repository) {}

  async findAll(tenantId: string, query: PaginationQuery) {
    const result = await this.repository.paginate(query.page, query.perPage, {
      order: { [query.sortBy]: query.sortOrder } as any,
    });
    return {
      data: __Name__Serializer.serializeMany(result.data),
      total: result.total,
    };
  }

  async findById(tenantId: string, id: string) {
    const entity = await this.repository.findByIdOrFail(id, '__Name__');
    return __Name__Serializer.serialize(entity);
  }

  async create(tenantId: string, data: Create__Name__Input) {
    const entity = await this.repository.create(data);
    return __Name__Serializer.serialize(entity);
  }

  async update(tenantId: string, id: string, data: Update__Name__Input) {
    const entity = await this.repository.update(id, data, '__Name__');
    return __Name__Serializer.serialize(entity);
  }

  async delete(tenantId: string, id: string) {
    await this.repository.delete(id, '__Name__');
  }
}
```

## 8. Controller: `src/modules/__names__/controllers/__name__.controller.ts`

```typescript
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { __Name__Service } from '../services/__name__.service.ts';
import { create__Name__Schema, update__Name__Schema, __name__ResponseSchema } from '../validators/__name__.validators.ts';
import { paginationSchema } from '../../../core/validators/pagination.schema.ts';
import { validationHook } from '../../../core/helpers/validator.ts';
import { ApiResponse } from '../../../core/helpers/response.ts';
import { authMiddleware } from '../../../core/middlewares/auth.middleware.ts';

export function create__Name__Controller(
  serviceFactory: (tenantId: string) => __Name__Service,
) {
  const app = new OpenAPIHono<{
    Variables: {
      tenantId: string;
      user: { id: string; tenantId: string; email: string; role: string };
    };
  }>();

  app.use('/*', authMiddleware);

  // GET / - List
  const listRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['__Names__'],
    summary: 'List all __names__',
    security: [{ Bearer: [] }],
    request: { query: paginationSchema },
    responses: {
      200: {
        description: 'Paginated list',
        content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.array(__name__ResponseSchema) }) } },
      },
    },
  });

  app.openapi(listRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const query = c.req.valid('query');
    const service = serviceFactory(tenantId);
    const result = await service.findAll(tenantId, query);
    return ApiResponse.paginated(c, result.data, result.total, query.page, query.perPage);
  }, validationHook);

  // GET /:id - Get by ID
  const getRoute = createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['__Names__'],
    summary: 'Get __name__ by ID',
    security: [{ Bearer: [] }],
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: '__Name__ details', content: { 'application/json': { schema: z.object({ success: z.boolean(), data: __name__ResponseSchema }) } } },
      404: { description: 'Not found' },
    },
  });

  app.openapi(getRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const { id } = c.req.valid('param');
    const service = serviceFactory(tenantId);
    const item = await service.findById(tenantId, id);
    return ApiResponse.success(c, item);
  }, validationHook);

  // POST / - Create
  const createRoute_ = createRoute({
    method: 'post',
    path: '/',
    tags: ['__Names__'],
    summary: 'Create __name__',
    security: [{ Bearer: [] }],
    request: { body: { content: { 'application/json': { schema: create__Name__Schema } } } },
    responses: {
      201: { description: 'Created', content: { 'application/json': { schema: z.object({ success: z.boolean(), data: __name__ResponseSchema }) } } },
    },
  });

  app.openapi(createRoute_, async (c) => {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json');
    const service = serviceFactory(tenantId);
    const item = await service.create(tenantId, body);
    return ApiResponse.created(c, item);
  }, validationHook);

  // PUT /:id - Update
  const updateRoute = createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['__Names__'],
    summary: 'Update __name__',
    security: [{ Bearer: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: update__Name__Schema } } },
    },
    responses: {
      200: { description: 'Updated', content: { 'application/json': { schema: z.object({ success: z.boolean(), data: __name__ResponseSchema }) } } },
    },
  });

  app.openapi(updateRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const service = serviceFactory(tenantId);
    const item = await service.update(tenantId, id, body);
    return ApiResponse.success(c, item);
  }, validationHook);

  // DELETE /:id - Delete
  const deleteRoute = createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['__Names__'],
    summary: 'Delete __name__',
    security: [{ Bearer: [] }],
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: 'Deleted', content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.null() }) } } },
    },
  });

  app.openapi(deleteRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const { id } = c.req.valid('param');
    const service = serviceFactory(tenantId);
    await service.delete(tenantId, id);
    return ApiResponse.success(c, null, 'Deleted successfully');
  }, validationHook);

  return app;
}
```

## 9. Module Factory: `src/modules/__names__/__name__.module.ts`

```typescript
import type { DataSource } from 'typeorm';
import { __Name__Repository } from './repositories/__name__.repository.ts';
import { __Name__Service } from './services/__name__.service.ts';
import { create__Name__Controller } from './controllers/__name__.controller.ts';

export function create__Name__Module(dataSource: DataSource) {
  const serviceFactory = (tenantId: string) => {
    const repository = new __Name__Repository(dataSource, tenantId);
    return new __Name__Service(repository);
  };
  return create__Name__Controller(serviceFactory);
}
```

## 10. Register in Router

In `src/routes/api.ts`:
```typescript
import { create__Name__Module } from '../modules/__names__/__name__.module.ts';

// Inside createApiRouter:
api.route('/__names__', create__Name__Module(dataSource));
```
