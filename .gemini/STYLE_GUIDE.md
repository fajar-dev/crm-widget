# Coding Style Guide

## TypeScript Conventions

### Naming

| Type | Convention | Example |
|------|-----------|---------|
| File | `kebab-case.type.ts` | `contact.entity.ts` |
| Class | `PascalCase` | `ContactService` |
| Interface | `PascalCase with I prefix` | `IContactService` |
| Enum | `PascalCase` | `ContactStatus` |
| Enum value | `UPPER_SNAKE_CASE` | `COLD_CALL` |
| Function | `camelCase` | `createContactModule` |
| Variable | `camelCase` | `tenantId` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |
| DB column | `snake_case` | `first_name` |
| DB table | `snake_case plural` | `contacts` |

### Import Order

```typescript
// 1. External packages
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Entity, Column } from 'typeorm';

// 2. Config imports
import { config } from '../../config/config.ts';

// 3. Core imports
import { BaseTenantRepository } from '../../core/repositories/base.repository.ts';
import { ApiResponse } from '../../core/helpers/response.ts';

// 4. Module imports (relative)
import { ContactRepository } from './repositories/contact.repository.ts';

// 5. Type-only imports
import type { DataSource } from 'typeorm';
import type { Context } from 'hono';
```

### Entity Pattern

```typescript
import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from '../../../core/interfaces/tenant-aware.interface.ts';

@Entity('table_name_plural')
export class EntityName extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 100, name: 'column_name' })
  propertyName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  optionalField?: string;

  @Column({
    type: 'enum',
    enum: SomeEnum,
    default: SomeEnum.DEFAULT_VALUE,
  })
  enumField!: SomeEnum;
}
```

### Service Pattern

```typescript
export class XxxService implements IXxxService {
  constructor(
    private readonly repository: XxxRepository,
  ) {}

  async findAll(tenantId: string, query: PaginationQuery) {
    const result = await this.repository.paginate(query.page, query.perPage);
    return {
      data: XxxSerializer.serializeMany(result.data),
      total: result.total,
    };
  }

  async findById(tenantId: string, id: string) {
    const entity = await this.repository.findByIdOrFail(id, 'Xxx');
    return XxxSerializer.serialize(entity);
  }

  async create(tenantId: string, data: CreateXxxInput) {
    const entity = await this.repository.create(data);
    return XxxSerializer.serialize(entity);
  }

  async update(tenantId: string, id: string, data: UpdateXxxInput) {
    const entity = await this.repository.update(id, data, 'Xxx');
    return XxxSerializer.serialize(entity);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.repository.delete(id, 'Xxx');
  }
}
```

### Controller Pattern

```typescript
export function createXxxController(serviceFactory: (tenantId: string) => XxxService) {
  const app = new OpenAPIHono<{
    Variables: {
      tenantId: string;
      user: { id: string; tenantId: string; email: string; role: string };
    };
  }>();

  app.use('/*', authMiddleware);

  const listRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['Xxx'],
    summary: 'List all items',
    security: [{ Bearer: [] }],
    request: { query: paginationSchema },
    responses: { /* ... */ },
  });

  app.openapi(listRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const query = c.req.valid('query');
    const service = serviceFactory(tenantId);
    const result = await service.findAll(tenantId, query);
    return ApiResponse.paginated(c, result.data, result.total, query.page, query.perPage);
  }, validationHook);

  return app;
}
```

### Response Helpers

```typescript
// Single item
return ApiResponse.success(c, data, 'Item retrieved');

// Created (201)
return ApiResponse.created(c, data, 'Item created');

// Paginated list
return ApiResponse.paginated(c, data, total, page, perPage);

// Error
return ApiResponse.error(c, 'Something went wrong', 400);
```

### Exception Usage

```typescript
// In service layer — throw typed exceptions
throw new NotFoundException('Contact not found');
throw new ConflictException('Email already registered');
throw new UnauthorizedException('Invalid credentials');
throw new BadRequestException('Invalid input', { email: ['Required'] });
throw new ForbiddenException('Insufficient permissions');
```

### Zod Schema Pattern

```typescript
export const createXxxSchema = z.object({
  fieldName: z.string().min(1).max(100).openapi({
    description: 'Human-readable description',
    example: 'Example value',
  }),
  optionalField: z.string().optional().openapi({
    description: 'Optional field',
  }),
  enumField: z.nativeEnum(SomeEnum).default(SomeEnum.DEFAULT).openapi({
    description: 'Enum field',
    example: SomeEnum.DEFAULT,
  }),
}).openapi('CreateXxxRequest');

export const updateXxxSchema = createXxxSchema.partial().openapi('UpdateXxxRequest');

export type CreateXxxInput = z.infer<typeof createXxxSchema>;
export type UpdateXxxInput = z.infer<typeof updateXxxSchema>;
```
