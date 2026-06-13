# Architecture

## Overview

Clean Architecture with row-level multi-tenancy. All modules follow a hybrid file structure with class-based OOP and constructor dependency injection.

## Layer Architecture

```
Request → Routes → Middleware → Controller → Service → Repository → Database
                                                ↓
                                            Serializer → Response
```

```
DataSource → Container → Module → Controller ← Routes
```

### Layers

| Layer | Responsibility | Pattern |
|-------|---------------|--------|
| Route | HTTP route definitions, maps URLs to controller methods | Functions in `routes/api/` |
| Module | DI wiring, creates controller with injected service factory | `createXxxModule()` returns Controller |
| Controller | Handler methods only (no router, no route definitions) | Class with public async methods |
| Service | Business logic, orchestration | Class with constructor DI |
| Repository | Data access, tenant scoping | Extends `BaseTenantRepository` |
| Serializer | Entity → DTO transformation | Static methods (`serialize`, `collection`) |
| Validator | Input validation schemas | Zod schemas |
| Interface | Type contracts, DI abstractions | TypeScript interfaces |

> **Note**: Controllers have NO router property — they only contain handler methods. Route definitions live in `routes/api/` files.

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
Container (DI) → module.ts (wiring) → Controller (handler methods)
                                            ↑
routes/api/xxx.ts (route definitions) ──────┘
```

Flow: `routes/api.ts` → `routes/api/contacts.ts` → `createContactModule(container)` → `ContactController`

Modules receive the container and return the controller instance:

```typescript
// Module — returns Controller, NOT router
export function createContactModule(container: Container): ContactController {
  return new ContactController((tenantId) => container.contactService(tenantId));
}
```

Route files define HTTP routes and use the module to get the controller:

```typescript
// routes/api/contacts.ts
export function contactRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createContactModule(container);

  router.use('/*', authMiddleware);
  router.get('/', validate('query', paginationSchema), (c) => controller.index(c));
  // ...
  return router;
}
```

## Multi-Tenancy

- **Strategy**: Row-level isolation via `tenant_id` column
- **Resolution**: `X-Tenant-ID` request header → validated by `tenantMiddleware`
- **Enforcement**: `BaseTenantRepository` auto-filters all queries by `tenantId`
- **Security**: JWT payload `tenantId` overrides header in auth middleware

## Module Structure (Hybrid)

Controller, service, and module files sit at the module root. Supporting files (entities, repositories, serializers, validators, interfaces, enums) live in subdirectories. Route definitions live in `routes/api/`:

```
modules/contacts/
├── entities/
│   └── contact.entity.ts        # TypeORM entity
├── repositories/
│   └── contact.repository.ts    # Data access
├── serializers/
│   └── contact.serializer.ts    # DTO transformer (serialize + collection)
├── validators/
│   └── contact.validator.ts     # Zod schemas
├── interfaces/
│   └── contact.interface.ts     # Type contracts
├── enums/
│   └── contact.enum.ts          # Enumerations
├── contact.controller.ts        # Handler methods only (no router)
├── contact.service.ts           # Business logic
└── contact.module.ts            # DI wiring (returns Controller)

routes/api/
├── auth.ts                      # Auth route definitions
├── contacts.ts                  # Contact route definitions
└── users.ts                     # User route definitions
```

> **Note**: User module is separate from Auth module. Auth handles authentication (login, register, tokens). User handles user profile and management.

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
