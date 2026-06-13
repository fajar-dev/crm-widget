# Architecture

This document describes the architecture of the CRM Multi-Tenant Backend. It is intended for developers (human or AI) who need to understand the system design, extend the codebase, or debug issues.

---

## Table of Contents

- [High-Level Overview](#high-level-overview)
- [Layer Architecture](#layer-architecture)
- [Dependency Flow](#dependency-flow)
- [Request Lifecycle](#request-lifecycle)
- [Multi-Tenant Design](#multi-tenant-design)
- [Module System](#module-system)
- [Error Handling Strategy](#error-handling-strategy)
- [Authentication & Authorization](#authentication--authorization)
- [Database Conventions](#database-conventions)
- [Code Conventions](#code-conventions)
- [Security Considerations](#security-considerations)

---

## High-Level Overview

The system is a multi-tenant CRM API built with:

- **Runtime**: Bun (fast JavaScript/TypeScript runtime)
- **Framework**: Hono (`OpenAPIHono` variant for auto-generated Swagger docs)
- **ORM**: TypeORM with PostgreSQL
- **Validation**: Zod with `@hono/zod-openapi` for request validation + OpenAPI schema generation
- **Storage**: MinIO (S3-compatible object storage)
- **Auth**: JWT via `hono/jwt` (built-in, no external packages)

All tenants share a single database, isolated at the row level via a `tenant_id` column on every entity.

---

## Layer Architecture

The system follows a clean layered architecture. Each layer has a single responsibility:

### 1. Controller Layer (`controllers/`)

- Defines HTTP routes using `OpenAPIHono` + `createRoute()`
- Handles request parsing and validation (via Zod schemas)
- Delegates business logic to the Service layer
- Formats responses using `ApiResponse` helper
- **NEVER** contains business logic or direct database access

```
Responsibilities:
  ✅ Route definitions with OpenAPI metadata
  ✅ Request validation (Zod schemas + validationHook)
  ✅ Extracting tenantId, user, and validated data from context
  ✅ Calling service methods
  ✅ Formatting responses with ApiResponse
  ❌ Business logic
  ❌ Direct database queries
  ❌ Entity manipulation
```

### 2. Service Layer (`services/`)

- Contains all business logic
- Receives tenant-scoped repository instances via constructor injection
- Calls repository methods for data access
- Uses serializers to transform entities before returning
- Throws typed exceptions (`NotFoundException`, `ConflictException`, etc.)

```
Responsibilities:
  ✅ Business rules and validation logic
  ✅ Orchestrating repository calls
  ✅ Data transformation via serializers
  ✅ Throwing domain-specific exceptions
  ❌ HTTP-specific concerns (request/response objects)
  ❌ Direct SQL queries (use repository methods)
```

### 3. Repository Layer (`repositories/`)

- Extends `BaseTenantRepository<T>` which auto-scopes ALL queries by `tenant_id`
- Provides CRUD operations inherited from base class
- Adds entity-specific query methods (search, find by status, etc.)
- Uses TypeORM's `Repository<T>` internally

```
Responsibilities:
  ✅ Data access and persistence
  ✅ Tenant-scoped queries (automatic via BaseTenantRepository)
  ✅ Complex query building
  ✅ Pagination
  ❌ Business logic
  ❌ Response formatting
```

### 4. Entity Layer (`entities/`)

- TypeORM entity classes decorated with `@Entity`, `@Column`, etc.
- ALL entities extend `TenantAwareEntity` (provides `id`, `tenantId`, `createdAt`, `updatedAt`)
- Database column mapping: TypeScript `camelCase` → DB `snake_case` via `name:` option
- Computed properties (getters) for derived values

### 5. Serializer Layer (`serializers/`)

- Transforms raw TypeORM entities into API-safe response objects
- Strips sensitive data (passwords, internal fields)
- Converts Date objects to ISO strings
- Provides `serialize()` and `serializeMany()` static methods

### 6. Validator Layer (`validators/`)

- Zod schemas for request validation
- Decorated with `.openapi()` for auto Swagger documentation
- Export inferred TypeScript types alongside schemas
- Separate schemas for create, update, and response

### 7. Interface Layer (`interfaces/`)

- Service contracts (e.g., `IContactService`) for dependency inversion
- Input/output type definitions
- Shared data structures

### 8. Enum Layer (`enums/`)

- String enums for type-safe constants
- Used in both entities (`@Column` type) and validators (`z.nativeEnum()`)
- Values are lowercase `snake_case` strings (stored in DB as-is)

---

## Dependency Flow

Dependencies flow in one direction: **inward**. Outer layers depend on inner layers, never the reverse.

```
┌─────────────────────────────────────────────────┐
│                   HTTP Request                  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Global Middleware                   │
│  (Logger → CORS → Error Handler)                │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│            Tenant Middleware                     │
│  (X-Tenant-ID header → context.tenantId)        │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│           Auth Middleware (if protected)         │
│  (Bearer JWT → context.user, override tenantId) │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                 Controller                       │
│  (Route handler: parse request, call service)   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                  Service                         │
│  (Business logic, calls repository)             │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                Repository                        │
│  (Tenant-scoped data access via TypeORM)        │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│               PostgreSQL Database                │
└─────────────────────────────────────────────────┘
```

### Module Wiring (Factory Pattern)

Each module uses a factory function to wire dependencies:

```
Module Factory (e.g., createContactModule)
  │
  ├─ Creates: ServiceFactory = (tenantId) => {
  │     ├─ new Repository(dataSource, tenantId)
  │     └─ new Service(repository)
  │  }
  │
  └─ Returns: createController(serviceFactory)
              └─ OpenAPIHono app with routes
```

The factory pattern creates a new service/repository per request, scoped to the tenant from that request. This ensures complete tenant isolation without shared state.

---

## Request Lifecycle

Here is the complete lifecycle of an authenticated API request:

```
1. HTTP Request arrives at Bun.serve
         │
2. Hono router matches path → /api/*
         │
3. Global middleware runs:
   ├─ logger()       → logs request method + path + timing
   ├─ cors()         → adds CORS headers
   └─ onError()      → catches unhandled errors (runs last)
         │
4. Tenant middleware runs:
   ├─ Reads X-Tenant-ID header
   ├─ Validates UUID format
   └─ Sets c.set('tenantId', tenantId)
         │
5. Module sub-app matches path → e.g., /contacts/*
         │
6. Auth middleware runs (if protected route):
   ├─ Reads Authorization: Bearer <token> header
   ├─ Verifies JWT signature via hono/jwt verify()
   ├─ Validates token type === 'access'
   ├─ Sets c.set('user', { id, tenantId, email, role })
   └─ Overrides c.set('tenantId', payload.tenantId)
         │
7. Route handler runs:
   ├─ Zod validation (via validationHook)
   │   └─ Returns 422 if validation fails
   ├─ Extracts tenantId from context
   ├─ Creates service via factory: serviceFactory(tenantId)
   │   └─ Factory creates: repo(dataSource, tenantId) → service(repo)
   ├─ Calls service.method(tenantId, ...)
   │   ├─ Service applies business logic
   │   ├─ Service calls repository (auto-scoped to tenant)
   │   ├─ Service serializes entity → response DTO
   │   └─ Service throws exception if error
   └─ Returns ApiResponse.success/created/paginated(c, data, message)
         │
8. Response sent to client as JSON:
   { success, statusCode, message, data, meta? }
```

---

## Multi-Tenant Design

### Strategy: Row-Level Tenancy

Every entity has a `tenant_id` UUID column. All queries are automatically filtered by this column via `BaseTenantRepository`.

**Why row-level?**
- Single database → simpler operations, backups, and migrations
- Scales to thousands of tenants without schema proliferation
- Index on `tenant_id` ensures query performance
- Simpler connection management vs. schema-per-tenant

### Tenant Resolution

Tenants are identified in two ways:

1. **Public routes** (e.g., login, register): `X-Tenant-ID` header (UUID format, validated by `tenantMiddleware`)
2. **Protected routes** (e.g., CRUD): JWT `tenantId` claim (overrides header value for security)

### Isolation Guarantees

- `BaseTenantRepository.tenantWhere()` injects `tenantId` into every query's WHERE clause
- `BaseTenantRepository.create()` auto-sets `tenantId` on new entities
- Auth middleware overrides `tenantId` from JWT payload, preventing header spoofing
- No cross-tenant data access is possible through the repository layer

### Tenant ID Flow

```
Public route:  X-Tenant-ID header → tenantMiddleware → c.set('tenantId')
Protected:     JWT payload.tenantId → authMiddleware → c.set('tenantId')  [overrides header]
Controller:    c.get('tenantId') → serviceFactory(tenantId) → new Repo(ds, tenantId)
Repository:    this.tenantId used in ALL queries via tenantWhere()
```

---

## Module System

Each feature is a self-contained module under `src/modules/<name>/`. Modules follow a strict structure:

```
modules/<name>/
├── entities/<name>.entity.ts          # TypeORM entity
├── enums/<name>.enum.ts               # String enums
├── interfaces/<name>.interface.ts     # Service contract + DTOs
├── validators/<name>.validators.ts    # Zod schemas + types
├── repositories/<name>.repository.ts  # Tenant-scoped repository
├── services/<name>.service.ts         # Business logic
├── serializers/<name>.serializer.ts   # Response transformers
├── controllers/<name>.controller.ts   # Route definitions
└── <name>.module.ts                   # Factory wiring
```

### Module Registration

Modules are registered in `src/routes/api.ts`:

```typescript
api.route('/contacts', createContactModule(dataSource));
api.route('/deals', createDealModule(dataSource));
```

---

## Error Handling Strategy

### Exception Hierarchy

```
BaseException (abstract)
├── BadRequestException      (400)
├── UnauthorizedException    (401)
├── ForbiddenException       (403)
├── NotFoundException        (404)
├── ConflictException        (409)
├── UnprocessableEntityException (422) — with field-level errors
└── InternalServerException  (500)
```

### Error Flow

1. Service/Repository throws a typed exception
2. Exception bubbles up through controller
3. Global `errorHandler` catches it in `app.onError()`
4. Handler checks `instanceof BaseException` → structured response
5. Unknown errors: show details in dev, hide in production

### Error Response Format

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Contact with id '...' not found",
  "data": null
}
```

Validation errors include field-level details:

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "data": null,
  "errors": {
    "email": ["Invalid email"],
    "firstName": ["String must contain at least 1 character(s)"]
  }
}
```

---

## Authentication & Authorization

### JWT Token Strategy

- **Access token**: Short-lived (default 15m), sent as `Authorization: Bearer <token>`
- **Refresh token**: Long-lived (default 7d), stored in database, used to obtain new access tokens

### Token Payload (`JwtPayload`)

```typescript
{
  sub: string;         // user ID
  tenantId: string;    // tenant scope
  email: string;
  role: UserRole;      // 'super_admin' | 'admin' | 'manager' | 'member'
  type: 'access' | 'refresh';
  iat: number;         // issued at (epoch seconds)
  exp: number;         // expires at (epoch seconds)
}
```

### Auth Flow

```
Register → hash password (Bun.password) → create user → generate tokens
Login    → verify password → update lastLoginAt → generate tokens
Refresh  → verify refresh JWT → revoke old token → generate new pair
Logout   → revoke refresh token in database
```

### Role-Based Access Control

Use `requireRole()` middleware after `authMiddleware`:

```typescript
app.use('/admin/*', authMiddleware, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN));
```

---

## Database Conventions

### Naming

| TypeScript | Database | Example |
|-----------|----------|---------|
| Entity class | Table (snake_case, plural) | `Contact` → `contacts` |
| Property (camelCase) | Column (snake_case) | `firstName` → `first_name` |
| Enum value | Stored as string | `ContactStatus.LEAD` → `'lead'` |
| Foreign key | `<entity>_id` | `user_id`, `tenant_id` |

### Column Mapping

Always use the `name` option in `@Column()` decorators for multi-word columns:

```typescript
@Column({ type: 'varchar', length: 100, name: 'first_name' })
firstName!: string;
```

Single-word columns don't need explicit `name` (TypeORM defaults to lowercase):

```typescript
@Column({ type: 'varchar', length: 255, nullable: true })
email?: string;
```

### Required Columns (via TenantAwareEntity)

Every entity automatically gets:
- `id` — UUID v4, primary key, auto-generated
- `tenant_id` — UUID, indexed, set automatically by repository
- `created_at` — Timestamp, set on insert
- `updated_at` — Timestamp, updated on every save

---

## Code Conventions

### File Naming

```
kebab-case.type.ts

Examples:
  contact.entity.ts
  contact.service.ts
  contact.controller.ts
  contact.module.ts
  auth.middleware.ts
  base.repository.ts
  tenant-aware.interface.ts
```

### Import Order

```typescript
// 1. External packages
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { DataSource } from 'typeorm';

// 2. Config
import { config } from '../config/config.ts';

// 3. Core infrastructure
import { ApiResponse } from '../core/helpers/response.ts';
import { NotFoundException } from '../core/exceptions/base.ts';

// 4. Module-local imports (relative)
import type { ContactService } from '../services/contact.service.ts';

// 5. Type-only imports use `import type`
import type { PaginationQuery } from '../core/validators/pagination.schema.ts';
```

### TypeScript Rules

- **Strict mode** enabled
- **No `any`** — use generics, `unknown`, or proper types
- **Explicit return types** on all public methods
- **JSDoc comments** on all public classes, interfaces, and methods
- **`type` imports** for type-only usage: `import type { X } from '...'`
- **Non-null assertion** (`!`) only on TypeORM entity properties

---

## Security Considerations

1. **Tenant isolation**: All queries go through `BaseTenantRepository` — cross-tenant access is architecturally impossible
2. **JWT override**: Auth middleware overrides `tenantId` from JWT, preventing header spoofing on protected routes
3. **Password security**: Bcrypt via `Bun.password.hash()` with cost factor 12
4. **Password exposure**: User entity marks `password` with `select: false` — never loaded unless explicitly requested
5. **Token rotation**: Refresh tokens are revoked on use, preventing replay attacks
6. **Input validation**: All inputs validated by Zod before reaching service layer
7. **Error hiding**: Internal error details hidden in production (`NODE_ENV=production`)
8. **CORS**: Configured globally — must be restricted for production deployment
9. **SQL injection**: Prevented by TypeORM's parameterized queries
10. **Type safety**: TypeScript strict mode + no `any` types eliminate entire categories of bugs
