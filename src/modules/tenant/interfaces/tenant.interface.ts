import type { UserRole } from '../../../core/interfaces/auth.interface.ts';
import type { SerializedTenant, SerializedMember } from '../serializers/tenant.serializer.ts';

export interface ITenantService {
  create(userId: string, data: CreateTenantInput): Promise<SerializedTenant>;
  findById(tenantId: string, userId: string): Promise<SerializedTenant>;
  findAllByUser(userId: string): Promise<SerializedTenant[]>;
  update(tenantId: string, userId: string, data: UpdateTenantInput): Promise<SerializedTenant>;
  regenerateCode(tenantId: string, userId: string): Promise<{ code: string }>;
  joinByCode(userId: string, code: string): Promise<SerializedTenant>;
  getMembers(tenantId: string, userId: string): Promise<SerializedMember[]>;
  inviteMember(tenantId: string, userId: string, data: InviteMemberInput): Promise<void>;
  updateMemberRole(tenantId: string, userId: string, targetUserId: string, role: UserRole): Promise<SerializedMember>;
  removeMember(tenantId: string, userId: string, targetUserId: string): Promise<void>;
  acceptInvitation(userId: string, token: string): Promise<SerializedTenant>;
}

export interface CreateTenantInput {
  name: string;
  company: string;
  slug: string;
}

export interface UpdateTenantInput {
  name?: string;
  company?: string;
  slug?: string;
}

export interface InviteMemberInput {
  email: string;
  role?: UserRole;
}
