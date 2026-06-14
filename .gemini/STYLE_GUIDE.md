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

### Tenant-Scoped Controller (uses service factory)

```typescript
export class ContactController {
  constructor(private readonly serviceFactory: (tenantId: string) => ContactService) {}

  async index(c: any) {
    const tenantId = c.get('tenantId');
    const query = c.req.valid('query') as PaginationQuery;
    const service = this.serviceFactory(tenantId);
    const result = await service.findAll(tenantId, query);
    return ApiResponse.paginated(c, result.data, result.total, query.page, query.perPage);
  }
}
```

### Global Controller (takes service directly)

```typescript
export class AuthController {
  constructor(private readonly service: AuthService) {}

  async register(c: any) {
    const body = c.req.valid('json') as RegisterInput;
    const result = await this.service.register(body);
    return ApiResponse.created(c, result, 'User registered successfully');
  }
}
```

> **Rule**: Auth and Tenant controllers take the service directly. Tenant-scoped controllers (Contacts, Deals, etc.) use a `serviceFactory`.

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

### Tenant-Scoped Module (passes factory)

```typescript
export function createContactModule(container: Container): ContactController {
  return new ContactController((tenantId) => container.contactService(tenantId));
}
```

### Global Module (passes service directly)

```typescript
export function createAuthModule(container: Container): AuthController {
  return new AuthController(container.authService());
}
```

## Route Pattern

### Tenant-Scoped Routes (require authMiddleware + requireTenant)

```typescript
import { authMiddleware, requireTenant } from '../../core/middlewares/auth.middleware.ts';

export function contactRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createContactModule(container);

  router.use('/*', authMiddleware, requireTenant);
  router.get('/', validate('query', paginationSchema), (c) => controller.index(c));
  // ...
  return router;
}
```

### Global Routes (auth only, no tenant required)

```typescript
export function tenantRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createTenantModule(container);

  router.use('/*', authMiddleware);
  router.post('/', validate('json', createTenantSchema), (c) => controller.create(c));
  // ...
  return router;
}
```

### Public Routes (no middleware)

```typescript
export function authRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createAuthModule(container);

  // Public
  router.post('/register', validate('json', registerSchema), (c) => controller.register(c));
  router.post('/login', validate('json', loginSchema), (c) => controller.login(c));

  // Authenticated
  router.get('/me', authMiddleware, (c) => controller.me(c));
  return router;
}
```

## Repository Pattern

### Global Repository (User, Tenant)

```typescript
export class UserRepository {
  private readonly repository: Repository<User>;
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }
}
```

### Tenant-Scoped Repository (Contact)

```typescript
export class ContactRepository extends BaseTenantRepository<Contact> {
  constructor(dataSource: DataSource, tenantId: string) {
    super(dataSource, Contact, tenantId);
  }
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
