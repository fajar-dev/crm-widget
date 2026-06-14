import type { Tenant } from '../entities/tenant.entity.ts';
import type { UserTenant } from '../entities/user-tenant.entity.ts';
import type { UserRole } from '../../../core/interfaces/auth.interface.ts';
import type { MembershipStatus } from '../enums/tenant.enum.ts';

export interface SerializedTenant {
  id: string;
  name: string;
  company: string;
  slug: string;
  code: string;
  codeExpiresAt: string | null;
  isActive: boolean;
  role?: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: MembershipStatus;
  joinedAt: string | null;
  createdAt: string;
}

export class TenantSerializer {
  static serialize(tenant: Tenant, role?: UserRole): SerializedTenant {
    return {
      id: tenant.id,
      name: tenant.name,
      company: tenant.company,
      slug: tenant.slug,
      code: tenant.code,
      codeExpiresAt: tenant.codeExpiresAt?.toISOString() ?? null,
      isActive: tenant.isActive,
      role,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    };
  }

  static collection(tenants: Tenant[], roles?: Map<string, UserRole>): SerializedTenant[] {
    return tenants.map((t) => TenantSerializer.serialize(t, roles?.get(t.id)));
  }

  static serializeMember(ut: UserTenant): SerializedMember {
    return {
      id: ut.id,
      userId: ut.userId,
      firstName: ut.user?.firstName ?? '',
      lastName: ut.user?.lastName ?? '',
      email: ut.user?.email ?? '',
      role: ut.role,
      status: ut.status,
      joinedAt: ut.joinedAt?.toISOString() ?? null,
      createdAt: ut.createdAt.toISOString(),
    };
  }

  static serializeMembers(members: UserTenant[]): SerializedMember[] {
    return members.map(TenantSerializer.serializeMember);
  }
}
