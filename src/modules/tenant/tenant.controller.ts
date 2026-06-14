import type { TenantService } from './tenant.service.ts';
import type { CreateTenantInput, UpdateTenantInput, InviteMemberInput } from './validators/tenant.validator.ts';
import type { UpdateMemberRoleInput } from './validators/tenant.validator.ts';
import type { JoinTenantInput } from './validators/tenant.validator.ts';
import { ApiResponse } from '../../core/helpers/response.ts';

export class TenantController {
  constructor(private readonly service: TenantService) {}

  async create(c: any) {
    const userId = c.get('user').id;
    const body = c.req.valid('json') as CreateTenantInput;
    const tenant = await this.service.create(userId, body);
    return ApiResponse.created(c, tenant, 'Tenant created successfully');
  }

  async index(c: any) {
    const userId = c.get('user').id;
    const tenants = await this.service.findAllByUser(userId);
    return ApiResponse.success(c, tenants);
  }

  async show(c: any) {
    const userId = c.get('user').id;
    const tenantId = c.req.param('id');
    const tenant = await this.service.findById(tenantId, userId);
    return ApiResponse.success(c, tenant);
  }

  async update(c: any) {
    const userId = c.get('user').id;
    const tenantId = c.req.param('id');
    const body = c.req.valid('json') as UpdateTenantInput;
    const tenant = await this.service.update(tenantId, userId, body);
    return ApiResponse.success(c, tenant, 'Tenant updated successfully');
  }

  async regenerateCode(c: any) {
    const userId = c.get('user').id;
    const tenantId = c.req.param('id');
    const result = await this.service.regenerateCode(tenantId, userId);
    return ApiResponse.success(c, result, 'Code regenerated successfully');
  }

  async join(c: any) {
    const userId = c.get('user').id;
    const body = c.req.valid('json') as JoinTenantInput;
    const tenant = await this.service.joinByCode(userId, body.code);
    return ApiResponse.success(c, tenant, 'Joined tenant successfully');
  }

  async members(c: any) {
    const userId = c.get('user').id;
    const tenantId = c.req.param('id');
    const members = await this.service.getMembers(tenantId, userId);
    return ApiResponse.success(c, members);
  }

  async invite(c: any) {
    const userId = c.get('user').id;
    const tenantId = c.req.param('id');
    const body = c.req.valid('json') as InviteMemberInput;
    await this.service.inviteMember(tenantId, userId, body);
    return ApiResponse.success(c, null, 'Invitation sent successfully');
  }

  async acceptInvite(c: any) {
    const userId = c.get('user').id;
    const body = c.req.valid('json') as { token: string };
    const tenant = await this.service.acceptInvitation(userId, body.token);
    return ApiResponse.success(c, tenant, 'Invitation accepted successfully');
  }

  async updateMember(c: any) {
    const userId = c.get('user').id;
    const tenantId = c.req.param('id');
    const targetUserId = c.req.param('userId');
    const body = c.req.valid('json') as UpdateMemberRoleInput;
    const member = await this.service.updateMemberRole(tenantId, userId, targetUserId, body.role);
    return ApiResponse.success(c, member, 'Member role updated successfully');
  }

  async removeMember(c: any) {
    const userId = c.get('user').id;
    const tenantId = c.req.param('id');
    const targetUserId = c.req.param('userId');
    await this.service.removeMember(tenantId, userId, targetUserId);
    return ApiResponse.success(c, null, 'Member removed successfully');
  }
}
