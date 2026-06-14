# Architecture

## Overview

Clean Architecture with schema-per-tenant multi-tenancy. Users are global in the `public` schema; tenant-scoped data is isolated in per-tenant PostgreSQL schemas (`tenant_<slug>`). All modules follow a hybrid file structure with class-based OOP and constructor dependency injection.

## Layer Architecture

```
Request → Routes → Middleware → Controller → Service → Repository → Database
                                                ↓
                                            Serializer → Response
```

```
SharedDataSource (public) ──┐
TenantDataSourceManager ────┤→ Container → Module → Controller ← Routes
```

### Layers

| Layer | Responsibility | Pattern |
|-------|---------------|--------|
| Route | HTTP route definitions, maps URLs to controller methods | Functions in `routes/api/` |
| Module | DI wiring, creates controller with injected dependencies | `createXxxModule()` returns Controller |
| Controller | Handler methods only (no router, no route definitions) | Class with public async methods |
| Service | Business logic, orchestration | Class with constructor DI |
| Repository | Data access | `BaseRepository` (same base for all) |
| Serializer | Entity → DTO transformation | Static methods (`serialize`, `collection`) |
| Validator | Input validation schemas | Zod schemas |
| Interface | Type contracts, DI abstractions | TypeScript interfaces |

> **Note**: Controllers have NO router property — they only contain handler methods. Route definitions live in `routes/api/` files.

## Dependency Injection

### Container Pattern

The `Container` class centralizes dependency wiring. It takes a shared `DataSource` (public schema) and a `TenantDataSourceManager` (per-tenant schemas). Global services (auth, tenant) use the shared DataSource. Tenant-scoped services (contacts) use a `DataSource` resolved by `tenantSlug`:

```typescript
// src/container.ts
export class Container {
  constructor(
    private readonly sharedDataSource: DataSource,
    private readonly tenantDataSourceManager: TenantDataSourceManager,
  ) {}

  // Shared services — public schema
  authService(): AuthService { /* ... */ }
  tenantService(): TenantService { /* ... */ }

  // Tenant-scoped services — per-tenant schema
  async contactService(tenantSlug: string): Promise<ContactService> {
    const ds = await this.tenantDataSourceManager.getDataSource(tenantSlug);
    const repo = new ContactRepository(ds);
    return new ContactService(repo);
  }
}
```

### Flow

```
Container (DI) → module.ts (wiring) → Controller (handler methods)
                                            ↑
routes/api/xxx.ts (route definitions) ──────┘
```

Flow: `routes/api.ts` → `routes/api/contacts.ts` → `createContactModule(container)` → `ContactController`

Modules receive the container and return the controller instance:

```typescript
// Tenant-scoped module — controller takes async service factory
export function createContactModule(container: Container): ContactController {
  return new ContactController((tenantSlug) => container.contactService(tenantSlug));
}

// Global module — controller takes service directly (no factory)
export function createAuthModule(container: Container): AuthController {
  return new AuthController(container.authService());
}

export function createTenantModule(container: Container): TenantController {
  return new TenantController(container.tenantService());
}
```

Route files define HTTP routes and use the module to get the controller:

```typescript
// routes/api/auth.ts — NO tenant middleware
export function authRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createAuthModule(container);
  router.post('/register', validate('json', registerSchema), (c) => controller.register(c));
  router.post('/login', validate('json', loginSchema), (c) => controller.login(c));
  router.post('/switch-tenant', authMiddleware, (c) => controller.switchTenant(c));
  return router;
}

// routes/api/tenants.ts — authMiddleware only
export function tenantRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createTenantModule(container);
  router.use('/*', authMiddleware);
  router.post('/', validate('json', createTenantSchema), (c) => controller.store(c));
  // ...
  return router;
}

// routes/api/contacts.ts — authMiddleware + requireTenant
export function contactRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createContactModule(container);
  router.use('/*', authMiddleware, requireTenant);
  router.get('/', validate('query', paginationSchema), (c) => controller.index(c));
  // ...
  return router;
}
```

## Multi-Tenancy

### Model

Users are **global** (no `tenant_id`). They belong to tenants via a `UserTenant` pivot table.

- **User**: Global entity (extends `BaseEntity`). Fields: `email`, `name`, `phone?`, `avatarUrl?`, `lastActiveTenantId?`
- **Tenant**: Workspace entity. Fields: `name`, `company`, `slug`, `code`, `codeExpiresAt?`, `isActive`
- **UserTenant** (pivot): `userId`, `tenantId`, `role` (owner/manager/member), `status` (active/invited/pending), `invitedBy?`, `joinedAt?`
- **TenantInvitation**: `email`, `token`, `role`, `expiresAt`, `acceptedAt?`
- **UserRole enum**: `OWNER`, `MANAGER`, `MEMBER`

### Database Schema

```
public schema:
  users              — Global users
  tenants            — Tenant workspaces
  user_tenants       — User ↔ Tenant pivot (role, status)
  tenant_invitations — Email-based invitations
  refresh_tokens     — Auth tokens

tenant_<slug> schema (one per tenant):
  contacts                — Tenant-scoped
  widget_settings         — Widget UI config (1:1 per tenant)
  chatbot_settings        — AI/model config (1:1 per tenant)
  chatbot_form_fields     — Custom pre-chat form definitions
  chatbot_sessions        — Visitor sessions (token + expiry)
  chatbot_session_values  — Key-value form data per session
  chatbot_conversations   — Chat threads linked to sessions
  chatbot_messages        — Messages per conversation
  knowledge_categories    — Knowledge grouping/folders
  knowledge_bases         — Knowledge content + pgvector embeddings
```

> **Note**: pgvector extension is enabled per tenant schema via `CREATE EXTENSION IF NOT EXISTS vector`.

### Strategy

- **Global data** (users, tenants): `public` schema, `sharedDataSource`
- **Tenant-scoped data** (contacts): Per-tenant schema (`tenant_<slug>`), resolved via `TenantDataSourceManager`
- **JWT**: Contains nullable `tenantId`, `tenantSlug`, and `role` (null when user has no tenant yet)
- **Schema creation**: Automatically on tenant creation via `TenantDataSourceManager.createTenantSchema(slug)`

### Middleware Layers

| Middleware | Purpose | Used By |
|------------|---------|--------|
| `authMiddleware` | Verify JWT, set `user` in context | `/tenants`, `/contacts`, all chatbot admin routes |
| `requireTenant` | Require `tenantId` in JWT (non-null) | `/contacts`, chatbot admin routes |
| `requireRole(...roles)` | Check user role against allowed roles | Specific routes |
| *(none)* | Public chat uses `X-Session-Token` header | `/chat/:tenantSlug/*` |

## Module Structure (Hybrid)

Controller, service, and module files sit at the module root. Supporting files (entities, repositories, serializers, validators, interfaces, enums) live in subdirectories. Route definitions live in `routes/api/`:

```
modules/contacts/                   # Tenant-scoped module
├── entities/
│   └── contact.entity.ts          # Extends BaseEntity
├── repositories/
│   └── contact.repository.ts      # Extends BaseRepository
├── serializers/
│   └── contact.serializer.ts      # DTO transformer (serialize + collection)
├── validators/
│   └── contact.validator.ts       # Zod schemas
├── interfaces/
│   └── contact.interface.ts       # Type contracts
├── enums/
│   └── contact.enum.ts            # Enumerations
├── contact.controller.ts          # Handler methods (uses serviceFactory)
├── contact.service.ts             # Business logic
└── contact.module.ts              # DI wiring (returns Controller)

modules/tenant/                     # Global module
├── entities/
│   ├── tenant.entity.ts           # Tenant workspace
│   ├── user-tenant.entity.ts      # User ↔ Tenant pivot
│   └── tenant-invitation.entity.ts # Email invitations
├── repositories/
├── serializers/
├── validators/
├── enums/
│   └── user-role.enum.ts          # OWNER, MANAGER, MEMBER
├── tenant.controller.ts           # Handler methods (takes Service directly)
├── tenant.service.ts              # Business logic
└── tenant.module.ts               # DI wiring (returns Controller)

modules/user/                       # Global module (no tenant_id)
├── entities/
│   └── user.entity.ts             # Extends BaseEntity (NOT TenantAwareEntity)
├── ...

routes/api/
├── auth.ts                        # No middleware (public)
├── tenants.ts                     # authMiddleware only
├── contacts.ts                    # authMiddleware + requireTenant
├── users.ts                       # User route definitions
├── widget-settings.ts             # authMiddleware + requireTenant
├── chatbot-settings.ts            # authMiddleware + requireTenant
├── chatbot-form-fields.ts         # authMiddleware + requireTenant
├── chatbot-sessions.ts            # authMiddleware + requireTenant
├── chatbot-conversations.ts       # authMiddleware + requireTenant
├── knowledge-categories.ts        # authMiddleware + requireTenant
├── knowledge-bases.ts             # authMiddleware + requireTenant
├── chat.ts                        # NO auth — public chat (session-based)
└── playground.ts                  # authMiddleware + requireTenant
```

> **Note**: User module is separate from Auth module. Auth handles authentication (login, register, tokens, switch-tenant). User handles user profile. Tenant handles workspace management, member management, and invitations.

## Chatbot System

### Pipeline (Agentic RAG via Google ADK)

```
Visitor → Form → Session → Conversation → Messages
                                            │
                                            ▼
                                    ChatService (orchestrator)
                                            │
                                            ▼
                                    AgentService (ADK LlmAgent)
                                    ├── Answer directly (greetings)
                                    └── Call searchKnowledge tool
                                            │
                                            ▼
                                    RetrievalService → EmbeddingService
                                            │
                                            ▼
                                    pgvector cosine similarity search
```

### Key Components

| Component | Description |
|-----------|-------------|
| `ChatbotService` | Settings CRUD, form fields, session management with token expiry |
| `KnowledgeService` | Category + knowledge base CRUD, auto-embedding on create/update |
| `ConversationService` | Conversation lifecycle + message storage |
| `AgentService` | Google ADK `LlmAgent` with `FunctionTool` for knowledge search |
| `RetrievalService` | pgvector cosine similarity search on knowledge_bases |
| `EmbeddingService` | Gemini `text-embedding-004` embedding generation |

### Session Flow

1. Widget loads → `GET /chat/:slug/config` → form fields + settings
2. Visitor fills form → `POST /chat/:slug/sessions` → `sessionToken` + `expiresAt`
3. Start conversation → `POST /chat/:slug/conversations` (with `X-Session-Token`)
4. Send messages → `POST /chat/:slug/conversations/:id/messages` (resets expiry)
5. End conversation → `POST /chat/:slug/conversations/:id/end`
6. New conversation → repeat step 3 (same session, fresh memory)

## API Documentation

OpenAPI spec is maintained in `docs/swagger.yml` (static YAML).
- Swagger UI served at `/docs`
- Raw spec served at `/openapi.yaml`

## Authentication Flow

1. User **registers** → creates global user only (no tenant)
2. User **logs in** → receives `{ user, tenants[], activeTenant, tokens }`
3. JWT contains nullable `tenantId`, `tenantSlug`, and `role` (null when user has no tenant)
4. Access token sent in `Authorization: Bearer <token>` header
5. `authMiddleware` verifies JWT, sets `user` in context
6. `requireTenant` middleware ensures `tenantId` is present in JWT
7. User can **create tenant** (becomes OWNER) or **join tenant** (by code or invitation)
8. User can **switch tenant** via `POST /auth/switch-tenant` → new JWT with updated `tenantId`/`role`
9. Refresh token rotated via `/api/auth/refresh`

## Error Handling

All errors extend `BaseException` and are caught by `errorHandler`:

| Exception | Status |
|-----------|--------|
| BadRequestException | 400 |
| UnauthorizedException | 401 |
| ForbiddenException | 403 |
| NotFoundException | 404 |
| ConflictException | 409 |
| UnprocessableEntityException | 422 |
| InternalServerException | 500 |

## Testing

- **Runner**: `bun test`
- **Database**: PostgreSQL test database (`crm_db_test`)
- **Pattern**: Integration tests using `app.request()` with real DB
- **Setup**: Global preload via `tests/setup.ts`

```bash
bun test              # Run all
bun test --watch      # Watch mode
```

## Code Conventions

- **Imports**: `import type` for type-only imports
- **Naming**: `PascalCase` for classes, `camelCase` for functions/variables
- **Files**: `kebab-case` or `dot-notation` (e.g., `contact.service.ts`)
- **Exports**: Named exports only, no default exports (except index.ts)
