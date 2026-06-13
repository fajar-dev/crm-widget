# Contributing — Adding a New Module

Follow these steps to add a new module (e.g., `deals`).

## Step-by-Step

### 1. Create Module Directory

```bash
mkdir src/modules/deals
```

### 2. Create Files (flat structure)

Create all files at the module root:

```
src/modules/deals/
├── deal.enum.ts          # Enumerations
├── deal.entity.ts        # TypeORM entity
├── deal.interface.ts     # Type contracts
├── deal.validator.ts     # Zod schemas
├── deal.repository.ts    # Data access
├── deal.serializer.ts    # DTO transformer
├── deal.service.ts       # Business logic
├── deal.controller.ts    # Route handler (class-based)
└── deal.module.ts        # DI wiring
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

### 4. Mount in Router

```typescript
// src/routes/api.ts
import { createDealModule } from '../modules/deals/deal.module.ts';

api.route('/deals', createDealModule(container));
```

### 5. Update swagger.yml

Add paths and schemas to `docs/swagger.yml`.

### 6. Add Tests

Create `tests/modules/deals/deal.test.ts` with integration tests.

### 7. Update CHANGELOG.md

Add entry under the latest version.

## Module Checklist

- [ ] Entity extends `TenantAwareEntity`
- [ ] Repository extends `BaseTenantRepository`
- [ ] Validator uses Zod (no `.openapi()` calls)
- [ ] Controller is class-based with `router` property
- [ ] Module wires controller via Container
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
