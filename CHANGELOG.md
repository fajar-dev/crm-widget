# Changelog

All notable changes to this project will be documented in this file.

This changelog is designed to be readable by both humans and AI models.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

## [0.1.0] - 2026-06-13

### Added
- Initial project setup with Hono + Bun + TypeORM + Zod + MinIO + Swagger
- Multi-tenant architecture with row-level tenancy (`tenant_id` column)
- Core infrastructure:
  - Exception hierarchy (`BaseException` → `BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, `UnprocessableEntity`, `InternalServer`)
  - `ApiResponse` helper (success, created, paginated, error)
  - `validationHook` for Zod → structured error responses
  - `MinioHelper` (upload, presignedUrl, delete, exists)
  - `TenantAwareEntity` base class with id, tenantId, createdAt, updatedAt
  - `BaseTenantRepository` with auto tenant_id scoping on ALL queries
  - `paginationSchema` reusable Zod schema
- Tenant resolution middleware (`X-Tenant-ID` header → `c.set('tenantId')`)
- JWT authentication middleware with role-based access control (`authMiddleware`, `requireRole()`)
- **Auth module**: register, login, refresh token, logout, get profile
  - User entity with password hashing (Bun.password + bcrypt)
  - Refresh token entity with token rotation
  - JWT signing/verification via `hono/jwt`
- **Contacts module**: full CRUD with pagination and search
  - Contact entity with status, source, company fields
  - Search by name, email, company
  - Filter by status
- Swagger UI at `/docs` with OpenAPI 3.1.0 spec at `/doc`
- Health check endpoint at `/health`
- Centralized environment config with Zod validation
- Global error handler (dev mode: stack traces, prod mode: sanitized)
- Documentation: README, ARCHITECTURE, CONTRIBUTING, MODULE_TEMPLATE, CHANGELOG

### Architecture Decisions
- **Row-level tenancy** chosen over schema-based for scalability (1000s+ tenants)
- **Factory pattern** for modules enables per-request tenant-scoped dependency injection
- **BaseTenantRepository** ensures ALL database queries include tenant_id filter
- **hono/jwt** used instead of `jsonwebtoken` package (native Hono integration)
- **Bun.password** used for password hashing (built-in bcrypt, no extra dependency)
- **OpenAPIHono** used for all apps/sub-apps (auto Swagger generation)
- **Serializer pattern** ensures raw entities are never exposed in API responses

### Tech Stack
- Runtime: Bun 1.3.x
- Framework: Hono 4.12.x (OpenAPIHono)
- ORM: TypeORM 0.3.x with PostgreSQL
- Validation: Zod 3.25.x with @hono/zod-openapi
- Storage: MinIO 8.x (S3-compatible)
- Auth: JWT (hono/jwt) + Bun.password (bcrypt)

### File Structure
```
src/
├── index.ts                          # Entry point
├── config/                           # Environment config, DB, MinIO
├── core/                             # Shared infrastructure
│   ├── exceptions/                   # Error hierarchy
│   ├── helpers/                      # Response, validator, MinIO helpers
│   ├── interfaces/                   # TenantAwareEntity base class
│   ├── middlewares/                  # Tenant, auth, error handler
│   ├── repositories/                 # BaseTenantRepository
│   └── validators/                   # Pagination schema
├── routes/                           # Route aggregator
└── modules/
    ├── auth/                         # Authentication module
    └── contacts/                     # Contacts module (example)
```

### Module Pattern
Each module follows: entity → enum → interface → validator → repository → service → serializer → controller → module factory
