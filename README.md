# CRM Multi-Tenant API

> Multi-tenant CRM backend with shared users, tenant workspaces, and invitation system. Built with **Hono**, **Bun**, **TypeORM**, **Zod**, and **MinIO**.

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/fajar-dev/crm-widget.git
cd crm-widget
bun install

# 2. Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET (min 16 chars), DB credentials

# 3. Start PostgreSQL + MinIO
docker compose up -d postgres minio

# 4. Run dev server
bun run dev

# 5. Open Swagger UI
# http://localhost:3000/docs
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Framework | Hono |
| ORM | TypeORM + PostgreSQL |
| Validation | Zod + @hono/zod-validator |
| Storage | MinIO (S3-compatible) |
| Auth | JWT (hono/jwt) + bcrypt |
| API Docs | Swagger UI + swagger.yml |
| Testing | bun test |

## Project Structure

```
src/
├── index.ts              # Entry point
├── container.ts          # DI Container
├── config/               # Environment, database, MinIO
├── core/                 # Shared: exceptions, middlewares, helpers
│   └── middlewares/
│       ├── auth.middleware.ts       # JWT verification
│       ├── require-tenant.middleware.ts  # Require tenantId in JWT
│       └── require-role.middleware.ts    # Role-based access
├── routes/
│   ├── api.ts            # Route aggregator
│   └── api/              # Route definitions per module
│       ├── auth.ts       # No middleware (public)
│       ├── tenants.ts    # authMiddleware only
│       ├── contacts.ts   # authMiddleware + requireTenant
│       └── users.ts
├── docs/swagger.yml      # OpenAPI 3.1.0 spec
└── modules/
    ├── auth/             # Auth module (login, register, refresh, switch-tenant)
    ├── user/             # User module (global, no tenant_id)
    ├── tenant/           # Tenant module (CRUD, join, members, invitations)
    │   ├── entities/
    │   │   ├── tenant.entity.ts
    │   │   ├── user-tenant.entity.ts
    │   │   └── tenant-invitation.entity.ts
    │   ├── repositories/
    │   ├── serializers/
    │   ├── validators/
    │   └── enums/
    └── contacts/         # Contacts module (tenant-scoped)

tests/
├── setup.ts              # Test config
├── helpers/              # Test utilities
├── core/                 # Middleware tests
└── modules/              # Integration tests
```

## API Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "meta": {
    "total": 50,
    "perPage": 10,
    "currentPage": 1,
    "lastPage": 5
  }
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (hot reload) |
| `bun run start` | Start production server |
| `bun run build` | Build for production |
| `bun run typecheck` | TypeScript type checking |
| `bun test` | Run all tests |
| `bun test --watch` | Run tests in watch mode |

## Multi-Tenancy

Users are **global** (no `tenant_id`) and can belong to multiple tenants via a pivot table (`UserTenant`). Each tenant is a workspace with its own contacts, members, and roles.

- **Auth routes** (`/auth`) — No tenant middleware, public
- **Tenant routes** (`/tenants`) — `authMiddleware` only
- **Contact routes** (`/contacts`) — `authMiddleware` + `requireTenant`
- **Roles**: `OWNER`, `MANAGER`, `MEMBER` per tenant
- **Invitation system**: Join by code or email-based invitation
- **JWT**: Contains nullable `tenantId` and `role` (null when user has no tenant)
- **Tenant-scoped data**: Contacts use `BaseTenantRepository` for row-level isolation

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design & patterns
- [CONTRIBUTING.md](./CONTRIBUTING.md) — How to add new modules
- [MODULE_TEMPLATE.md](./MODULE_TEMPLATE.md) — Copy-paste templates
- [CHANGELOG.md](./CHANGELOG.md) — Version history
