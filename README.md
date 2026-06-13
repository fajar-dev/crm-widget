# CRM Multi-Tenant Backend

A scalable, multi-tenant CRM backend built with modern TypeScript technologies following clean architecture and SOLID principles.

## Tech Stack

| Technology | Purpose |
|------------|--------|
| **Bun** | JavaScript runtime |
| **Hono** | Web framework |
| **TypeORM** | ORM (PostgreSQL) |
| **Zod** | Schema validation |
| **MinIO** | Object storage (S3-compatible) |
| **Swagger** | API documentation |

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.2.x
- PostgreSQL >= 14
- MinIO (optional, for file uploads)

### Setup

```bash
# Clone and install
bun install

# Copy environment config
cp .env.example .env
# Edit .env with your database credentials

# Start development server
bun run dev
```

### API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/doc
- **Health Check**: http://localhost:3000/health

## Project Structure

```
src/
├── index.ts                          # Entry point
├── config/
│   ├── config.ts                     # Env config (Zod validated)
│   ├── database.ts                   # TypeORM DataSource
│   └── minio.ts                      # MinIO client
├── core/
│   ├── exceptions/base.ts            # Exception hierarchy
│   ├── helpers/
│   │   ├── response.ts               # API response formatter
│   │   ├── validator.ts              # Zod validation hook
│   │   └── minio.ts                  # MinIO helper
│   ├── interfaces/
│   │   └── tenant-aware.interface.ts # Base tenant entity
│   ├── middlewares/
│   │   ├── tenant.middleware.ts      # Tenant resolution
│   │   ├── auth.middleware.ts        # JWT authentication
│   │   └── error-handler.middleware.ts
│   ├── repositories/
│   │   └── base.repository.ts        # Tenant-scoped base repo
│   └── validators/
│       └── pagination.schema.ts      # Shared pagination schema
├── routes/
│   └── api.ts                        # Route aggregator
└── modules/
    ├── auth/                         # Authentication module
    │   ├── entities/
    │   ├── enums/
    │   ├── interfaces/
    │   ├── validators/
    │   ├── repositories/
    │   ├── services/
    │   ├── serializers/
    │   ├── controllers/
    │   └── auth.module.ts
    └── contacts/                     # Contacts module (example)
        ├── entities/
        ├── enums/
        ├── interfaces/
        ├── validators/
        ├── repositories/
        ├── services/
        ├── serializers/
        ├── controllers/
        └── contact.module.ts
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Multi-Tenant Design

- **Strategy**: Row-level tenancy (`tenant_id` column on every entity)
- **Resolution**: `X-Tenant-ID` header (public routes) / JWT claim (protected routes)
- **Isolation**: `BaseTenantRepository` auto-filters ALL queries by tenant

## Creating New Modules

See [CONTRIBUTING.md](./CONTRIBUTING.md) for step-by-step guide and [MODULE_TEMPLATE.md](./MODULE_TEMPLATE.md) for copy-paste templates.

## API Response Format

All responses follow this structure:

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

## Scripts

| Command | Description |
|---------|------------|
| `bun run dev` | Start dev server with hot reload |
| `bun run start` | Start production server |
| `bun run build` | Build for production |
| `bun run typecheck` | TypeScript type checking |
| `bun run migration:generate` | Generate migration |
| `bun run migration:run` | Run migrations |
| `bun run migration:revert` | Revert last migration |

## License

Private
