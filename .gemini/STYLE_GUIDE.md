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
import { createContactSchema } from './contact.validator.ts';
```

## Controller Pattern

```typescript
export class ExampleController {
  public readonly router: Hono;

  constructor(private readonly serviceFactory: (tenantId: string) => ExampleService) {
    this.router = new Hono();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.use('/*', authMiddleware);
    this.router.get('/', validate('query', paginationSchema), (c) => this.index(c));
    // ...
  }

  private async index(c: any) {
    const tenantId = c.get('tenantId');
    const query = c.req.valid('query') as PaginationQuery;
    // ...
  }
}
```

## Service Pattern

```typescript
export class ExampleService implements IExampleService {
  constructor(private readonly repository: ExampleRepository) {}

  async findAll(_tenantId: string, query: PaginationQuery) {
    // Always return serialized DTOs
    const result = await this.repository.paginate(...);
    return { data: ExampleSerializer.serializeMany(result.data), total: result.total };
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
