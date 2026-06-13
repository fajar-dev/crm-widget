# Style Guide

## TypeScript

- Strict mode enabled
- `import type` for type-only imports
- No `any` unless unavoidable (document with comment)
- Prefer `interface` over `type` for object shapes

## Import Order

```typescript
// 1. External packages
import { Hono } from 'hono';
import type { DataSource } from 'typeorm';

// 2. Core modules
import { validate } from '../../core/helpers/validator.ts';
import { ApiResponse } from '../../core/helpers/response.ts';

// 3. Local module files
import type { ContactService } from './contact.service.ts';
import { createContactSchema } from './validators/contact.validator.ts';
```

## Controller Pattern

Controllers only contain public handler methods — no router, no route definitions:

```typescript
export class ExampleController {
  constructor(private readonly serviceFactory: (tenantId: string) => ExampleService) {}

  async index(c: any) {
    const tenantId = c.get('tenantId');
    const query = c.req.valid('query') as PaginationQuery;
    const service = this.serviceFactory(tenantId);
    const result = await service.findAll(tenantId, query);
    return ApiResponse.paginated(c, result.data, result.total, query.page, query.perPage);
  }

  async show(c: any) { /* ... */ }
  async store(c: any) { /* ... */ }
  async update(c: any) { /* ... */ }
  async destroy(c: any) { /* ... */ }
}
```

## Service Pattern

```typescript
export class ExampleService implements IExampleService {
  constructor(private readonly repository: ExampleRepository) {}

  async findAll(_tenantId: string, query: PaginationQuery) {
    // Always return serialized DTOs
    const result = await this.repository.paginate(...);
    return { data: ExampleSerializer.collection(result.data), total: result.total };
  }
}
```

## Validator Pattern

```typescript
import { z } from 'zod';

export const createSchema = z.object({
  name: z.string().min(1).max(200),
});

export const updateSchema = createSchema.partial();

export type CreateInput = z.infer<typeof createSchema>;
export type UpdateInput = z.infer<typeof updateSchema>;
```

## Module Pattern

Modules handle DI wiring and return a Controller instance (not a router):

```typescript
import type { Container } from '../../container.ts';
import { ExampleController } from './example.controller.ts';

export function createExampleModule(container: Container): ExampleController {
  return new ExampleController((tenantId) => container.exampleService(tenantId));
}
```

## Route Pattern

Route definitions live in `routes/api/` and map URLs to controller methods:

```typescript
// src/routes/api/examples.ts
import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createExampleModule } from '../../modules/example/example.module.ts';
import { createExampleSchema, updateExampleSchema } from '../../modules/example/validators/example.validator.ts';
import { paginationSchema } from '../../core/validators/pagination.schema.ts';
import { validate } from '../../core/helpers/validator.ts';
import { authMiddleware } from '../../core/middlewares/auth.middleware.ts';

export function exampleRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createExampleModule(container);

  router.use('/*', authMiddleware);
  router.get('/', validate('query', paginationSchema), (c) => controller.index(c));
  router.get('/:id', (c) => controller.show(c));
  router.post('/', validate('json', createExampleSchema), (c) => controller.store(c));
  router.put('/:id', validate('json', updateExampleSchema), (c) => controller.update(c));
  router.delete('/:id', (c) => controller.destroy(c));

  return router;
}
```

## API Response

```typescript
// Single item
return ApiResponse.success(c, data, 'Optional message');

// Created
return ApiResponse.created(c, data, 'Resource created successfully');

// Paginated list
return ApiResponse.paginated(c, data, total, page, perPage);

// Error (handled by errorHandler, usually thrown as exceptions)
throw new NotFoundException('Resource not found');
```

## Testing Pattern

```typescript
import { describe, expect, test, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Hono } from 'hono';

describe('Module Name', () => {
  let app: Hono;
  let ds: DataSource;

  beforeAll(async () => {
    ds = await createTestDataSource();
    // Build test app
  });

  afterAll(() => destroyTestDataSource());
  beforeEach(() => clearAllTables(ds));

  test('GET / returns list', async () => {
    const res = await app.request('/path', { headers });
    expect(res.status).toBe(200);
  });
});
```
