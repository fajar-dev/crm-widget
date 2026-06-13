# Architecture

## Overview

Clean Architecture with row-level multi-tenancy. All modules follow a flat file structure with class-based OOP and constructor dependency injection.

## Layer Architecture

```
Request → Middleware → Controller → Service → Repository → Database
                                       ↓
                                   Serializer → Response
```

### Layers

| Layer | Responsibility | Pattern |
|-------|---------------|--------|
| Controller | Route handling, request validation | Class with `router` property |
| Service | Business logic, orchestration | Class with constructor DI |
| Repository | Data access, tenant scoping | Extends `BaseTenantRepository` |
| Serializer | Entity → DTO transformation | Static methods |
| Validator | Input validation schemas | Zod schemas |
| Interface | Type contracts, DI abstractions | TypeScript interfaces |

## Dependency Injection

### Container Pattern

The `Container` class centralizes dependency wiring:

```typescript
// src/container.ts
export class Container {
  constructor(private readonly dataSource: DataSource) {}

  contactService(tenantId: string): ContactService {
    const repo = new ContactRepository(this.dataSource, tenantId);
    return new ContactService(repo);
  }
}
```

### Flow

```
DataSource → Container → Module → Controller(serviceFactory) → Service(repo)
```

Modules receive the container and wire their controllers:

```typescript
// Module
export function createContactModule(container: Container) {
  const controller = new ContactController(
    (tenantId) => container.contactService(tenantId)
  );
  return controller.router;
}
```

## Multi-Tenancy

- **Strategy**: Row-level isolation via `tenant_id` column
- **Resolution**: `X-Tenant-ID` request header → validated by `tenantMiddleware`
- **Enforcement**: `BaseTenantRepository` auto-filters all queries by `tenantId`
- **Security**: JWT payload `tenantId` overrides header in auth middleware

## Module Structure (Flat)

Each module contains all files at root level — no subdirectories:

```
modules/contacts/
├── contact.controller.ts    # Class-based route handler
├── contact.service.ts       # Business logic
├── contact.repository.ts    # Data access
├── contact.entity.ts        # TypeORM entity
├── contact.serializer.ts    # DTO transformer
├── contact.validator.ts     # Zod schemas
├── contact.interface.ts     # Type contracts
├── contact.enum.ts          # Enumerations
└── contact.module.ts        # DI wiring
```

## API Documentation

OpenAPI spec is maintained in `docs/swagger.yml` (static YAML).
- Swagger UI served at `/docs`
- Raw spec served at `/openapi.yaml`

## Authentication Flow

1. User registers/logs in → receives `accessToken` + `refreshToken`
2. Access token sent in `Authorization: Bearer <token>` header
3. `authMiddleware` verifies JWT, sets `user` + `tenantId` in context
4. Refresh token rotated via `/api/auth/refresh`

## Error Handling

All errors extend `BaseException` and are caught by `errorHandler`:

| Exception | Status |
|-----------|--------|
| BadRequestException | 400 |
| UnauthorizedException | 401 |
| ForbiddenException | 403 |
| NotFoundException | 404 |
| ConflictException | 409 |
| UnprocessableEntityException | 422 |
| InternalServerException | 500 |

## Testing

- **Runner**: `bun test`
- **Database**: PostgreSQL test database (`crm_db_test`)
- **Pattern**: Integration tests using `app.request()` with real DB
- **Setup**: Global preload via `tests/setup.ts`

```bash
bun test              # Run all
bun test --watch      # Watch mode
```

## Code Conventions

- **Imports**: `import type` for type-only imports
- **Naming**: `PascalCase` for classes, `camelCase` for functions/variables
- **Files**: `kebab-case` or `dot-notation` (e.g., `contact.service.ts`)
- **Exports**: Named exports only, no default exports (except index.ts)
