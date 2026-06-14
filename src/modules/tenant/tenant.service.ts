import type { ITenantService, CreateTenantInput, UpdateTenantInput, InviteMemberInput } from './interfaces/tenant.interface.ts';
import type { TenantRepository } from './repositories/tenant.repository.ts';
import type { UserTenantRepository } from './repositories/user-tenant.repository.ts';
import type { TenantInvitationRepository } from './repositories/tenant-invitation.repository.ts';
import type { UserRepository } from '../user/repositories/user.repository.ts';
import type { TenantDataSourceManager } from '../../config/tenant-datasource.ts';
import type { UserTenant } from './entities/user-tenant.entity.ts';
import { TenantSerializer, type SerializedTenant, type SerializedMember } from './serializers/tenant.serializer.ts';
import { UserRole } from '../../core/interfaces/auth.interface.ts';
import { MembershipStatus } from './enums/tenant.enum.ts';
import { NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '../../core/exceptions/base.ts';
import { randomBytes } from 'crypto';

export class TenantService implements ITenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userTenantRepository: UserTenantRepository,
    private readonly invitationRepository: TenantInvitationRepository,
    private readonly userRepository: UserRepository,
    private readonly tenantDataSourceManager: TenantDataSourceManager,
  ) {}

  async create(userId: string, data: CreateTenantInput): Promise<SerializedTenant> {
    const existing = await this.tenantRepository.findBySlug(data.slug);
    if (existing) throw new ConflictException('Slug already taken');

    const code = this.generateCode();
    const tenant = await this.tenantRepository.create({ ...data, code });

    // Create per-tenant schema with tables
    await this.tenantDataSourceManager.createTenantSchema(tenant.slug);

    await this.userTenantRepository.create({
      userId,
      tenantId: tenant.id,
      role: UserRole.OWNER,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    });

    return TenantSerializer.serialize(tenant, UserRole.OWNER);
  }

  async findById(tenantId: string, userId: string): Promise<SerializedTenant> {
    const membership = await this.userTenantRepository.findByUserAndTenant(userId, tenantId);
    if (!membership) throw new ForbiddenException('Not a member of this tenant');

    const tenant = await this.tenantRepository.findByIdOrFail(tenantId);
    return TenantSerializer.serialize(tenant, membership.role);
  }

  async findAllByUser(userId: string): Promise<SerializedTenant[]> {
    const memberships = await this.userTenantRepository.findAllByUser(userId);
    return memberships.map((m) => TenantSerializer.serialize(m.tenant, m.role));
  }

  async update(tenantId: string, userId: string, data: UpdateTenantInput): Promise<SerializedTenant> {
    await this.requireRole(userId, tenantId, [UserRole.OWNER]);

    if (data.slug) {
      const existing = await this.tenantRepository.findBySlug(data.slug);
      if (existing && existing.id !== tenantId) throw new ConflictException('Slug already taken');
    }

    const tenant = await this.tenantRepository.update(tenantId, data);
    return TenantSerializer.serialize(tenant, UserRole.OWNER);
  }

  async regenerateCode(tenantId: string, userId: string): Promise<{ code: string }> {
    await this.requireRole(userId, tenantId, [UserRole.OWNER]);
    const code = this.generateCode();
    await this.tenantRepository.update(tenantId, { code });
    return { code };
  }

  async joinByCode(userId: string, code: string): Promise<SerializedTenant> {
    const tenant = await this.tenantRepository.findByCode(code);
    if (!tenant) throw new NotFoundException('Invalid tenant code');
    if (!tenant.isActive) throw new BadRequestException('Tenant is not active');
    if (tenant.codeExpiresAt && new Date() > tenant.codeExpiresAt) {
      throw new BadRequestException('Tenant code has expired');
    }

    const existing = await this.userTenantRepository.findByUserAndTenant(userId, tenant.id);
    if (existing) throw new ConflictException('Already a member of this tenant');

    await this.userTenantRepository.create({
      userId,
      tenantId: tenant.id,
      role: UserRole.MEMBER,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    });

    return TenantSerializer.serialize(tenant, UserRole.MEMBER);
  }

  async getMembers(tenantId: string, userId: string): Promise<SerializedMember[]> {
    await this.requireMembership(userId, tenantId);
    const members = await this.userTenantRepository.findAllByTenant(tenantId);
    return TenantSerializer.serializeMembers(members);
  }

  async inviteMember(tenantId: string, userId: string, data: InviteMemberInput): Promise<void> {
    await this.requireRole(userId, tenantId, [UserRole.OWNER, UserRole.MANAGER]);

    const existingInvite = await this.invitationRepository.findByEmailAndTenant(data.email, tenantId);
    if (existingInvite) throw new ConflictException('Invitation already sent to this email');

    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      const membership = await this.userTenantRepository.findByUserAndTenant(existingUser.id, tenantId);
      if (membership) throw new ConflictException('User is already a member');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.invitationRepository.create({
      tenantId,
      email: data.email,
      role: data.role || UserRole.MEMBER,
      token,
      invitedBy: userId,
      expiresAt,
    });
  }

  async acceptInvitation(userId: string, token: string): Promise<SerializedTenant> {
    const invitation = await this.invitationRepository.findByToken(token);
    if (!invitation) throw new NotFoundException('Invalid invitation token');
    if (invitation.isExpired) throw new BadRequestException('Invitation has expired');
    if (invitation.isAccepted) throw new BadRequestException('Invitation already accepted');

    const user = await this.userRepository.findByIdOrFail(userId);
    if (user.email !== invitation.email) {
      throw new ForbiddenException('This invitation is for a different email address');
    }

    const existing = await this.userTenantRepository.findByUserAndTenant(userId, invitation.tenantId);
    if (existing) throw new ConflictException('Already a member of this tenant');

    await this.userTenantRepository.create({
      userId,
      tenantId: invitation.tenantId,
      role: invitation.role,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    });

    await this.invitationRepository.markAccepted(invitation.id);

    const tenant = await this.tenantRepository.findByIdOrFail(invitation.tenantId);
    return TenantSerializer.serialize(tenant, invitation.role);
  }

  async updateMemberRole(tenantId: string, userId: string, targetUserId: string, role: UserRole): Promise<SerializedMember> {
    await this.requireRole(userId, tenantId, [UserRole.OWNER]);

    if (userId === targetUserId) throw new BadRequestException('Cannot change your own role');
    if (role === UserRole.OWNER) throw new BadRequestException('Cannot assign owner role');

    const membership = await this.userTenantRepository.findByUserAndTenant(targetUserId, tenantId);
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === UserRole.OWNER) throw new ForbiddenException('Cannot change owner role');

    const updated = await this.userTenantRepository.updateRole(targetUserId, tenantId, { role });
    return TenantSerializer.serializeMember(updated);
  }

  async removeMember(tenantId: string, userId: string, targetUserId: string): Promise<void> {
    await this.requireRole(userId, tenantId, [UserRole.OWNER]);

    if (userId === targetUserId) throw new BadRequestException('Cannot remove yourself');

    const membership = await this.userTenantRepository.findByUserAndTenant(targetUserId, tenantId);
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === UserRole.OWNER) throw new ForbiddenException('Cannot remove the owner');

    await this.userTenantRepository.remove(targetUserId, tenantId);
  }

  private async requireMembership(userId: string, tenantId: string): Promise<UserTenant> {
    const membership = await this.userTenantRepository.findByUserAndTenant(userId, tenantId);
    if (!membership) throw new ForbiddenException('Not a member of this tenant');
    return membership;
  }

  private async requireRole(userId: string, tenantId: string, roles: UserRole[]): Promise<UserTenant> {
    const membership = await this.requireMembership(userId, tenantId);
    if (!roles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return membership;
  }

  private generateCode(): string {
    return randomBytes(5).toString('hex').toUpperCase();
  }
}
