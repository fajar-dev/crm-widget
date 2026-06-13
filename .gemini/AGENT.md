# AI Agent Context — CRM Multi-Tenant Backend

## Project Overview

This is a **multi-tenant CRM backend** built with Hono + Bun + TypeORM + Zod + MinIO + Swagger.
Architecture: Clean Architecture + SOLID principles.
Multi-tenancy: Row-level tenancy (`tenant_id` column on every entity).

## Key Files to Read First

1. `ARCHITECTURE.md` — System design, layer descriptions, request lifecycle
2. `CONTRIBUTING.md` — How to add new modules (step-by-step)
3. `MODULE_TEMPLATE.md` — Copy-paste templates for new modules
4. `CHANGELOG.md` — Recent changes, decisions, file structure
5. `src/core/` — Read ALL files in this directory to understand infrastructure

## Working Rules

### MUST Follow

1. **ALL new entities MUST extend `TenantAwareEntity`** from `src/core/interfaces/tenant-aware.interface.ts`
2. **ALL new repositories MUST extend `BaseTenantRepository`** from `src/core/repositories/base.repository.ts`
3. **ALL API responses MUST use `ApiResponse`** helper from `src/core/helpers/response.ts`
4. **ALL route definitions MUST use `OpenAPIHono` + `createRoute`** from `@hono/zod-openapi`
5. **ALL request validation MUST use Zod schemas** with `.openapi()` decorators
6. **ALL modules MUST follow the factory pattern**: `createXxxModule(dataSource)` returning OpenAPIHono app
7. **ALL new modules MUST be registered** in `src/routes/api.ts`
8. **ALWAYS update CHANGELOG.md** after making changes
9. **ALWAYS use serializers** to transform entities before returning in responses
10. **ALWAYS add JSDoc comments** on public interfaces, classes, and methods

### MUST NOT

1. **NEVER import plain `Hono`** — always use `OpenAPIHono` from `@hono/zod-openapi`
2. **NEVER use `any` type** — use proper generics and interfaces
3. **NEVER skip tenant scoping** — all queries must go through `BaseTenantRepository`
4. **NEVER expose passwords** — entities with password MUST use `select: false`
5. **NEVER hard-code configuration** — use `config` from `src/config/config.ts`
6. **NEVER return raw entities** — always use serializers
7. **NEVER put business logic in controllers** — controllers only handle HTTP I/O
8. **NEVER put HTTP concepts in services** — services are framework-agnostic

### Code Style

- TypeScript strict mode
- Use `type` imports: `import type { X } from '...'`
- Explicit return types on all public methods
- `camelCase` for TypeScript properties, `snake_case` for database columns
- Use `name: 'column_name'` in TypeORM `@Column()` decorators
- File naming: `kebab-case.type.ts` (e.g., `contact.entity.ts`, `auth.service.ts`)
- Import order: external packages → config → core → module → types

### Module Creation Checklist

When asked to create a new module:

1. Create entity extending `TenantAwareEntity`
2. Create enum (if needed)
3. Create interface with service contract
4. Create Zod validators with `.openapi()` decorators
5. Create repository extending `BaseTenantRepository`
6. Create service implementing the interface
7. Create serializer for response transformation
8. Create controller with `OpenAPIHono` routes
9. Create module factory wiring repo → service → controller
10. Register module in `src/routes/api.ts`
11. Update `CHANGELOG.md`

### Environment

- **Runtime**: Bun (NOT Node.js)
- **Dev command**: `bun run dev` (hot reload)
- **Bun auto-loads `.env` files** — no dotenv import needed
- **Password hashing**: `Bun.password.hash()` and `Bun.password.verify()`
- **JWT**: `hono/jwt` — `sign()` and `verify()`
- **Database**: TypeORM with PostgreSQL
- **Path aliases**: `@config/*`, `@core/*`, `@modules/*`, `@routes/*` (defined in tsconfig)

### Key Patterns

```typescript
// Module factory pattern
export function createXxxModule(dataSource: DataSource) {
  const serviceFactory = (tenantId: string) => {
    const repo = new XxxRepository(dataSource, tenantId);
    return new XxxService(repo);
  };
  return createXxxController(serviceFactory);
}

// Controller factory pattern
export function createXxxController(serviceFactory: (tenantId: string) => XxxService) {
  const app = new OpenAPIHono();
  app.use('/*', authMiddleware);
  // ... routes with createRoute()
  return app;
}

// Repository pattern
export class XxxRepository extends BaseTenantRepository<Xxx> {
  constructor(dataSource: DataSource, tenantId: string) {
    super(dataSource, Xxx, tenantId);
  }
}
```

### Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "total": 50,
    "perPage": 10,
    "currentPage": 1,
    "lastPage": 5,
    "from": 1,
    "to": 10
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "data": null,
  "errors": {
    "email": ["Invalid email"],
    "password": ["String must contain at least 8 character(s)"]
  }
}
```
