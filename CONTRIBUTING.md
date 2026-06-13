# Contributing — Adding a New Module

Follow these steps to add a new module (e.g., `deals`).

## Step-by-Step

### 1. Create Module Directory

```bash
mkdir src/modules/deals
```

### 2. Create Files (hybrid structure)

Controller, service, and module at the module root. Supporting files in subdirectories:

```
src/modules/deals/
├── entities/
│   └── deal.entity.ts        # TypeORM entity
├── repositories/
│   └── deal.repository.ts    # Data access
├── serializers/
│   └── deal.serializer.ts    # DTO transformer
├── validators/
│   └── deal.validator.ts     # Zod schemas
├── interfaces/
│   └── deal.interface.ts     # Type contracts
├── enums/
│   └── deal.enum.ts          # Enumerations
├── deal.service.ts           # Business logic
├── deal.controller.ts        # Handler methods (class-based)
└── deal.module.ts            # DI wiring (returns Controller)
```

### 3. Register in Container

```typescript
// src/container.ts
import { DealRepository } from './modules/deals/deal.repository.ts';
import { DealService } from './modules/deals/deal.service.ts';

// Add method:
dealService(tenantId: string): DealService {
  const repo = new DealRepository(this.dataSource, tenantId);
  return new DealService(repo);
}
```

### 4. Create Route File

Create `src/routes/api/deals.ts`:

```typescript
import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createDealModule } from '../../modules/deals/deal.module.ts';
import { createDealSchema, updateDealSchema } from '../../modules/deals/validators/deal.validator.ts';
import { paginationSchema } from '../../core/validators/pagination.schema.ts';
import { validate } from '../../core/helpers/validator.ts';
import { authMiddleware } from '../../core/middlewares/auth.middleware.ts';

export function dealRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createDealModule(container);

  router.use('/*', authMiddleware);
  router.get('/', validate('query', paginationSchema), (c) => controller.index(c));
  router.get('/:id', (c) => controller.show(c));
  router.post('/', validate('json', createDealSchema), (c) => controller.store(c));
  router.put('/:id', validate('json', updateDealSchema), (c) => controller.update(c));
  router.delete('/:id', (c) => controller.destroy(c));

  return router;
}
```

### 5. Mount in Router

```typescript
// src/routes/api.ts
import { dealRoutes } from './api/deals.ts';

api.route('/deals', dealRoutes(container));
```

### 6. Update swagger.yml

Add paths and schemas to `docs/swagger.yml`.

### 7. Add Tests

Create `tests/modules/deals/deal.test.ts` with integration tests.

### 8. Update CHANGELOG.md

Add entry under the latest version.

## Module Checklist

- [ ] Entity extends `TenantAwareEntity`
- [ ] Repository extends `BaseTenantRepository`
- [ ] Validator uses Zod (no `.openapi()` calls)
- [ ] Controller is class-based with public handler methods (no router)
- [ ] Module wires controller via Container, returns Controller instance
- [ ] Route file created in `routes/api/`
- [ ] Registered in `container.ts`
- [ ] Mounted in `routes/api.ts`
- [ ] Swagger paths added to `docs/swagger.yml`
- [ ] Integration tests created
- [ ] CHANGELOG updated

## Naming Conventions

| Type | Pattern | Example |
|------|---------|--------|
| File | `{module}.{type}.ts` | `deal.service.ts` |
| Class | `PascalCase` | `DealController` |
| Method | `camelCase` | `findById` |
| Route | `kebab-case` | `/api/deals` |
| DB Column | `snake_case` | `deal_value` |
| DB Table | `snake_case` plural | `deals` |
