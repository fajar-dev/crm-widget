# Changelog

All notable changes to this project will be documented in this file.
This changelog is designed to be readable by both humans and AI models.

---

## [0.3.0] — 2026-06-14

### Changed — Multi-Tenancy Refactor (Shared Users)

- **Multi-tenancy model**: Shared users + tenant pivot (`UserTenant`) replaces row-level user tenancy
- **User entity is now global**: No `tenant_id`, no `role` — extends `BaseEntity` instead of `TenantAwareEntity`
- **UserRole enum**: `owner`, `manager`, `member` (was `super_admin`, `admin`, `manager`, `member`)
- **Auth flow**: Register creates global user (no tenant), login returns tenant list + active tenant, switch-tenant endpoint
- **JWT supports nullable tenantId/role**: `null` when user has no tenant selected
- **Middleware split**: `authMiddleware` (JWT verify), `requireTenant` (require tenantId in JWT), `requireRole(...roles)`
- **Routes restructured**: `/auth` (public), `/tenants` (auth-only), `/contacts` (auth + requireTenant)
- **Auth/tenant services are global**: `container.authService()` and `container.tenantService()` take NO tenantId
- **User fields added**: `phone`, `avatarUrl`, `lastActiveTenantId`

### Added

- **Tenant module** — CRUD, join by code, member management, regenerate invite code
- **TenantInvitation system** — Invite by email with token, accept via token, expiry
- **`BaseEntity`** — Non-tenant base entity for global entities (`User`, `Tenant`, `UserTenant`)
- **`requireTenant` middleware** — Rejects requests without tenantId in JWT
- **Switch tenant endpoint** — `POST /auth/switch-tenant` returns new tokens with selected tenant
- **Login returns tenant list** — `{ user, tenants[], activeTenant, tokens }`
- **Last active tenant** — Login auto-selects last used tenant

### Technical Context (for AI agents)

**Database Tables**:
```
users              — global (no tenant_id)
tenants            — tenant registry (name, company, slug, code)
user_tenants       — pivot (userId, tenantId, role, status)
tenant_invitations — email invitation tokens
refresh_tokens     — JWT refresh (nullable tenantId)
contacts           — tenant-scoped (has tenant_id)
```

**Architecture Pattern**:
```
Container (DI) → module.ts (wiring) → Controller (handler methods)
                                            ↑
routes/api/xxx.ts (route definitions) ──────┘

Auth/Tenant: container.authService() → AuthController (direct)
Contacts:    container.contactService(tenantId) → ContactController (factory)
```

**Middleware Layers**:
```
/auth/*      → NO middleware (public routes)
/tenants/*   → authMiddleware
/contacts/*  → authMiddleware + requireTenant
```

---

## [0.2.0] — 2026-06-14

### Changed — Major Refactoring

- **Hybrid module structure**: Supporting files (entities, repositories, serializers, validators, interfaces, enums) in subdirectories; controller, service, module at root
- **Plain Hono**: Replaced `OpenAPIHono` + `@hono/zod-openapi` with plain `Hono` + `@hono/zod-validator`
- **Swagger YAML**: API docs now defined in `docs/swagger.yml` (static OpenAPI 3.1.0) instead of programmatic generation
- **OOP Controllers**: Controllers now only have handler methods — no router property, no route definitions
- **Routes separated from controllers**: Route definitions moved to `routes/api/` directory
- **module.ts handles DI wiring**: Returns Controller instance directly (not router)
- **User module extracted from Auth**: User management is now a separate module from authentication
- **`serializeMany` renamed to `collection`**: Serializer method for multiple entities
- **Container DI**: Centralized `Container` class in `src/container.ts` replaces per-module factory functions
- **Shared auth types**: Moved `UserRole`, `JwtPayload`, `AuthUser` from `modules/auth/` to `core/interfaces/auth.interface.ts`
- **Validation**: `validate()` helper replaces `validationHook` from zod-openapi

### Added

- `src/container.ts` — DI Container class
- `src/core/interfaces/auth.interface.ts` — Shared auth types
- `docs/swagger.yml` — Static OpenAPI spec
- `tests/` — Full integration test suite

### Removed

- `@hono/zod-openapi` dependency
- `validationHook` from `core/helpers/validator.ts`
- Old-style module subdirectories (`controllers/`, `services/`)

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
