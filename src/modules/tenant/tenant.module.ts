import type { Container } from '../../container.ts';
import { TenantController } from './tenant.controller.ts';

export function createTenantModule(container: Container): TenantController {
  return new TenantController(container.tenantService());
}
