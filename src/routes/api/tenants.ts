import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createTenantModule } from '../../modules/tenant/tenant.module.ts';
import {
  createTenantSchema,
  updateTenantSchema,
  joinTenantSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInvitationSchema,
} from '../../modules/tenant/validators/tenant.validator.ts';
import { validate } from '../../core/helpers/validator.ts';
import { authMiddleware } from '../../core/middlewares/auth.middleware.ts';

export function tenantRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createTenantModule(container);

  // All tenant routes require authentication
  router.use('/*', authMiddleware);

  // Tenant CRUD
  router.post('/', validate('json', createTenantSchema), (c) => controller.create(c));
  router.get('/', (c) => controller.index(c));
  router.post('/join', validate('json', joinTenantSchema), (c) => controller.join(c));
  router.post('/accept-invite', validate('json', acceptInvitationSchema), (c) => controller.acceptInvite(c));

  // Tenant detail
  router.get('/:id', (c) => controller.show(c));
  router.put('/:id', validate('json', updateTenantSchema), (c) => controller.update(c));
  router.post('/:id/regenerate-code', (c) => controller.regenerateCode(c));

  // Member management
  router.get('/:id/members', (c) => controller.members(c));
  router.post('/:id/members/invite', validate('json', inviteMemberSchema), (c) => controller.invite(c));
  router.put('/:id/members/:userId', validate('json', updateMemberRoleSchema), (c) => controller.updateMember(c));
  router.delete('/:id/members/:userId', (c) => controller.removeMember(c));

  return router;
}
