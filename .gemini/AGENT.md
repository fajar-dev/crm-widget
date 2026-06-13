# AI Agent Rules

## Project Context

- **Stack**: Bun + Hono + TypeORM + PostgreSQL + Zod + MinIO
- **Architecture**: Multi-tenant (row-level), Clean Architecture, OOP + Constructor DI
- **Version**: 0.2.0

## MUST Follow

1. **Flat module structure** — All module files at root level (no subdirectories)
2. **Class-based controllers** — Controllers are classes with `router` property
3. **Container DI** — Register services in `src/container.ts`
4. **Plain Hono** — Do NOT use `OpenAPIHono` or `@hono/zod-openapi`
5. **validate()** — Use `validate('json', schema)` from `core/helpers/validator.ts`
6. **Entities extend TenantAwareEntity** — For automatic `tenant_id` column
7. **Repositories extend BaseTenantRepository** — For tenant-scoped queries
8. **Serializers** — Always return serialized DTOs from services, never raw entities
9. **ApiResponse** — Use `ApiResponse.success()`, `.created()`, `.paginated()` for all responses
10. **Tests** — Add integration tests in `tests/modules/{name}/` for every new module

## MUST NOT

1. Do NOT use `OpenAPIHono`, `createRoute`, or `.openapi()` on Zod schemas
2. Do NOT create subdirectories inside modules (no `controllers/`, `services/`, etc.)
3. Do NOT import auth types from `modules/auth/` in core — use `core/interfaces/auth.interface.ts`
4. Do NOT use default exports (except `src/index.ts`)
5. Do NOT skip the Container — always wire dependencies through `container.ts`
6. Do NOT return raw TypeORM entities from API — always serialize

## File Naming

```
{module}.controller.ts
{module}.service.ts
{module}.repository.ts
{module}.entity.ts
{module}.serializer.ts
{module}.validator.ts
{module}.interface.ts
{module}.enum.ts
{module}.module.ts
```

## Adding a New Module

1. Create `src/modules/{name}/` with all files (see MODULE_TEMPLATE.md)
2. Add service factory to `src/container.ts`
3. Mount in `src/routes/api.ts`
4. Add paths to `docs/swagger.yml`
5. Create `tests/modules/{name}/{name}.test.ts`
6. Update `CHANGELOG.md`

## Key Files

| File | Purpose |
|------|--------|
| `src/container.ts` | DI Container — all service creation |
| `src/routes/api.ts` | Route aggregator — all module mounting |
| `docs/swagger.yml` | API documentation |
| `src/core/helpers/validator.ts` | Zod validation middleware |
| `src/core/repositories/base.repository.ts` | Tenant-scoped base repository |
