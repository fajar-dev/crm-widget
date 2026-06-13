# Changelog

All notable changes to this project will be documented in this file.
This changelog is designed to be readable by both humans and AI models.

---

## [0.2.0] — 2026-06-14

### Changed — Major Refactoring

- **Flat module structure**: Removed subdirectories (`controllers/`, `services/`, `repositories/`, etc.) — all module files now sit at the module root
- **Plain Hono**: Replaced `OpenAPIHono` + `@hono/zod-openapi` with plain `Hono` + `@hono/zod-validator`
- **Swagger YAML**: API docs now defined in `docs/swagger.yml` (static OpenAPI 3.1.0) instead of programmatic generation
- **OOP Controllers**: Controllers are now classes with `router` property and constructor DI, instead of factory functions returning OpenAPIHono apps
- **Container DI**: Centralized `Container` class in `src/container.ts` replaces per-module factory functions
- **Shared auth types**: Moved `UserRole`, `JwtPayload`, `AuthUser` from `modules/auth/` to `core/interfaces/auth.interface.ts`
- **Validation**: `validate()` helper replaces `validationHook` from zod-openapi

### Added

- `src/container.ts` — DI Container class
- `src/core/interfaces/auth.interface.ts` — Shared auth types
- `docs/swagger.yml` — Static OpenAPI spec
- `tests/` — Full integration test suite
  - `tests/setup.ts` — Global test config
  - `tests/helpers/test-database.ts` — Test DB factory
  - `tests/helpers/test-jwt.ts` — JWT token generator
  - `tests/helpers/seed.ts` — Data seeding
  - `tests/core/tenant.middleware.test.ts`
  - `tests/core/auth.middleware.test.ts`
  - `tests/modules/auth/auth.test.ts`
  - `tests/modules/contacts/contact.test.ts`

### Removed

- `@hono/zod-openapi` dependency
- `validationHook` from `core/helpers/validator.ts`
- All module subdirectories (`controllers/`, `services/`, `repositories/`, `entities/`, `enums/`, `interfaces/`, `serializers/`, `validators/`)

### Technical Context (for AI agents)

**Architecture Pattern**:
```
Container(DataSource)
  → serviceFactory(tenantId) = Repository + Service
  → Controller(serviceFactory).router
  → Module(container) → Hono sub-app
```

**Key Dependencies**:
- `hono` — HTTP framework (plain, not OpenAPIHono)
- `@hono/zod-validator` — Request validation middleware
- `@hono/swagger-ui` — Swagger UI renderer
- `typeorm` — ORM with PostgreSQL
- `zod` — Schema validation (no .openapi() decorators)

---

## [0.1.0] — 2026-06-13

### Added — Initial Release

- Multi-tenant CRM backend with Hono + Bun + TypeORM
- Auth module (register, login, JWT refresh, logout, profile)
- Contacts module (CRUD with pagination & search)
- Row-level tenant isolation via `BaseTenantRepository`
- JWT authentication with `Bun.password` (bcrypt)
- MinIO integration for file storage
- Project documentation (ARCHITECTURE, CONTRIBUTING, MODULE_TEMPLATE)
