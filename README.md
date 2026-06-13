# CRM Multi-Tenant API

> Multi-tenant CRM backend built with **Hono**, **Bun**, **TypeORM**, **Zod**, and **MinIO**.

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
├── routes/
│   ├── api.ts            # Route aggregator
│   └── api/              # Route definitions per module
│       ├── auth.ts
│       ├── contacts.ts
│       └── users.ts
├── docs/swagger.yml      # OpenAPI 3.1.0 spec
└── modules/
    ├── auth/             # Auth module (hybrid)
    ├── users/            # User module (hybrid)
    └── contacts/         # Contacts module (hybrid)

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

All API requests require `X-Tenant-ID` header with a valid UUID. Row-level tenant isolation is enforced automatically via `BaseTenantRepository`.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design & patterns
- [CONTRIBUTING.md](./CONTRIBUTING.md) — How to add new modules
- [MODULE_TEMPLATE.md](./MODULE_TEMPLATE.md) — Copy-paste templates
- [CHANGELOG.md](./CHANGELOG.md) — Version history
