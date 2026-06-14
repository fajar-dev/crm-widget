# AI Agent Rules

## Project Context

- **Stack**: Bun + Hono + TypeORM + PostgreSQL + Zod + MinIO
- **Architecture**: Multi-tenant (shared users + tenant pivot), Clean Architecture, OOP + Constructor DI
- **Version**: 0.3.0

## MUST Follow

1. **Hybrid module structure** — Controller, service, module at root; supporting files (entities, repositories, serializers, validators, interfaces, enums) in subdirectories
2. **Class-based controllers** — Controllers only have handler methods — no router property, no route definitions
3. **Module DI wiring** — `module.ts` handles DI wiring — returns Controller instance (not router)
4. **Route definitions in routes/api/** — Route files define HTTP routes, NOT controllers
5. **Container DI** — Register services in `src/container.ts`
6. **Plain Hono** — Do NOT use `OpenAPIHono` or `@hono/zod-openapi`
7. **validate()** — Use `validate('json', schema)` from `core/helpers/validator.ts`
8. **Global entities extend BaseEntity** — `User`, `Tenant`, `UserTenant` use `BaseEntity` (no `tenant_id`)
9. **Tenant-scoped entities extend TenantAwareEntity** — `Contact` and other tenant data use `TenantAwareEntity`
10. **Tenant-scoped repositories extend BaseTenantRepository** — For auto tenant filtering
11. **Global repositories use direct TypeORM Repository** — `UserRepository`, `TenantRepository` etc.
12. **UserRole**: Only `OWNER`, `MANAGER`, `MEMBER` — defined in `core/interfaces/auth.interface.ts`
13. **Serializers** — Always return serialized DTOs from services, use `collection()` (not `serializeMany`)
14. **ApiResponse** — Use `ApiResponse.success()`, `.created()`, `.paginated()` for all responses
15. **Middleware split** — `authMiddleware` (JWT verify), `requireTenant` (require tenantId), `requireRole(...roles)`
16. **Tests** — Add integration tests in `tests/modules/{name}/` for every new module

## MUST NOT

1. Do NOT use `OpenAPIHono`, `createRoute`, or `.openapi()` on Zod schemas
2. Do NOT create extra subdirectories beyond the standard ones (`entities/`, `repositories/`, `serializers/`, `validators/`, `interfaces/`, `enums/`)
3. Do NOT import auth types from `modules/auth/` in core — use `core/interfaces/auth.interface.ts`
4. Do NOT use default exports (except `src/index.ts`)
5. Do NOT skip the Container — always wire dependencies through `container.ts`
6. Do NOT return raw TypeORM entities from API — always serialize
7. Do NOT put `tenant_id` on User entity — User is global
8. Do NOT put `role` on User entity — role is per-tenant in `UserTenant` pivot

## File Naming

```
{module}.controller.ts              # At module root
{module}.service.ts                  # At module root
{module}.module.ts                   # At module root
entities/{module}.entity.ts          # In subdirectory
repositories/{module}.repository.ts  # In subdirectory
serializers/{module}.serializer.ts   # In subdirectory
validators/{module}.validator.ts     # In subdirectory
interfaces/{module}.interface.ts     # In subdirectory
enums/{module}.enum.ts               # In subdirectory
```

## Adding a New Module

1. Create `src/modules/{name}/` with all files (see MODULE_TEMPLATE.md)
2. Add service factory to `src/container.ts`
   - Global service: `myService(): MyService` (no tenantId)
   - Tenant-scoped: `myService(tenantId: string): MyService`
3. Create route file in `src/routes/api/{name}.ts`
   - Use `authMiddleware` + `requireTenant` for tenant-scoped routes
   - Use `authMiddleware` only for global routes
4. Mount in `src/routes/api.ts`
5. Add paths to `docs/swagger.yml`
6. Create `tests/modules/{name}/{name}.test.ts`
7. Update `CHANGELOG.md`

## Key Files

| File | Purpose |
|------|--------|
| `src/container.ts` | DI Container — all service creation |
| `src/routes/api.ts` | Route aggregator — all module mounting |
| `src/routes/api/` | Route definitions — HTTP routes per module |
| `src/modules/{name}/{name}.module.ts` | DI wiring — returns Controller instance |
| `src/core/interfaces/base.entity.ts` | BaseEntity for global entities |
| `src/core/interfaces/tenant-aware.interface.ts` | TenantAwareEntity for tenant-scoped entities |
| `src/core/middlewares/auth.middleware.ts` | authMiddleware, requireTenant, requireRole |
| `docs/swagger.yml` | API documentation |
| `src/core/helpers/validator.ts` | Zod validation middleware |
| `src/core/repositories/base.repository.ts` | Tenant-scoped base repository |
