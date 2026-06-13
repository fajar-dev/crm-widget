# Contributing Guide

## Creating a New Module

Follow these steps to add a new module (e.g., `deals`):

### Step 1: Create Entity

```bash
mkdir -p src/modules/deals/{entities,enums,interfaces,validators,repositories,services,serializers,controllers}
```

Create `src/modules/deals/entities/deal.entity.ts`:
```typescript
import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from '../../../core/interfaces/tenant-aware.interface.ts';

@Entity('deals')
export class Deal extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 })
  title!: string;
  
  // Add more columns...
}
```

### Step 2: Create Enum (if needed)

Create `src/modules/deals/enums/deal.enum.ts` with status values, types, etc.

### Step 3: Create Interface

Create `src/modules/deals/interfaces/deal.interface.ts`:
- Define `IDealService` interface
- Define `CreateDealInput` and `UpdateDealInput` types

### Step 4: Create Validators

Create `src/modules/deals/validators/deal.validators.ts`:
- Define Zod schemas with `.openapi()` decorators
- Export `createDealSchema`, `updateDealSchema`, `dealResponseSchema`
- Export inferred types

### Step 5: Create Repository

Create `src/modules/deals/repositories/deal.repository.ts`:
```typescript
import type { DataSource } from 'typeorm';
import { BaseTenantRepository } from '../../../core/repositories/base.repository.ts';
import { Deal } from '../entities/deal.entity.ts';

export class DealRepository extends BaseTenantRepository<Deal> {
  constructor(dataSource: DataSource, tenantId: string) {
    super(dataSource, Deal, tenantId);
  }
  // Add custom query methods if needed
}
```

### Step 6: Create Service

Create `src/modules/deals/services/deal.service.ts`:
- Implement `IDealService`
- Constructor-inject `DealRepository`
- Return serialized data from all methods

### Step 7: Create Serializer

Create `src/modules/deals/serializers/deal.serializer.ts`:
- Static `serialize(deal)` and `serializeMany(deals)` methods
- Transform entity to API-safe response

### Step 8: Create Controller

Create `src/modules/deals/controllers/deal.controller.ts`:
- Use `createDealController(serviceFactory)` factory pattern
- Define routes with `createRoute()` from `@hono/zod-openapi`
- Use `validationHook` and `ApiResponse`

### Step 9: Create Module Factory

Create `src/modules/deals/deal.module.ts`:
```typescript
import type { DataSource } from 'typeorm';
import { DealRepository } from './repositories/deal.repository.ts';
import { DealService } from './services/deal.service.ts';
import { createDealController } from './controllers/deal.controller.ts';

export function createDealModule(dataSource: DataSource) {
  const dealServiceFactory = (tenantId: string) => {
    const dealRepository = new DealRepository(dataSource, tenantId);
    return new DealService(dealRepository);
  };
  return createDealController(dealServiceFactory);
}
```

### Step 10: Register in Router

Add to `src/routes/api.ts`:
```typescript
import { createDealModule } from '../modules/deals/deal.module.ts';
// Inside createApiRouter:
api.route('/deals', createDealModule(dataSource));
```

### Step 11: Update CHANGELOG.md

Add entry under `[Unreleased]` > `### Added`.

---

## Module Checklist

Before submitting a new module, verify:

- [ ] Entity extends `TenantAwareEntity`
- [ ] Repository extends `BaseTenantRepository`
- [ ] Service implements interface contract
- [ ] Serializer strips sensitive data
- [ ] Controller uses `OpenAPIHono` + `createRoute`
- [ ] All Zod schemas have `.openapi()` decorators
- [ ] Module factory wires repo → service → controller
- [ ] Module registered in `src/routes/api.ts`
- [ ] CHANGELOG.md updated
- [ ] All responses use `ApiResponse` helper

## Code Style

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| File | `kebab-case.type.ts` | `deal.entity.ts` |
| Class | `PascalCase` | `DealService` |
| Interface | `IPascalCase` | `IDealService` |
| Enum | `PascalCase` | `DealStatus` |
| Function | `camelCase` | `createDealModule` |
| DB column | `snake_case` | `first_name` |
| DB table | `snake_case plural` | `deals` |

### Import Order

1. External packages (`hono`, `typeorm`, `zod`)
2. Config imports (`../../config/*`)
3. Core imports (`../../core/*`)
4. Module imports (relative `./`)
5. Type-only imports (use `import type`)

### TypeScript Rules

- Strict mode enabled
- No `any` types — use proper generics
- Explicit return types on public methods
- JSDoc comments on all public APIs
- Use `type` imports: `import type { X } from '...'`
