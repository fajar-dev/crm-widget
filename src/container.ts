import type { DataSource } from 'typeorm';
import type { TenantDataSourceManager } from './config/tenant-datasource.ts';
import { UserRepository } from './modules/user/repositories/user.repository.ts';
import { RefreshTokenRepository } from './modules/auth/repositories/refresh-token.repository.ts';
import { TenantRepository } from './modules/tenant/repositories/tenant.repository.ts';
import { UserTenantRepository } from './modules/tenant/repositories/user-tenant.repository.ts';
import { TenantInvitationRepository } from './modules/tenant/repositories/tenant-invitation.repository.ts';
import { AuthService } from './modules/auth/auth.service.ts';
import { TenantService } from './modules/tenant/tenant.service.ts';
import { ContactRepository } from './modules/contacts/repositories/contact.repository.ts';
import { ContactService } from './modules/contacts/contact.service.ts';

export class Container {
  constructor(
    private readonly sharedDataSource: DataSource,
    private readonly tenantDataSourceManager: TenantDataSourceManager,
  ) {}

  // ── Shared repositories (public schema) ─────────────

  userRepository(): UserRepository {
    return new UserRepository(this.sharedDataSource);
  }

  tenantRepository(): TenantRepository {
    return new TenantRepository(this.sharedDataSource);
  }

  userTenantRepository(): UserTenantRepository {
    return new UserTenantRepository(this.sharedDataSource);
  }

  invitationRepository(): TenantInvitationRepository {
    return new TenantInvitationRepository(this.sharedDataSource);
  }

  refreshTokenRepository(): RefreshTokenRepository {
    return new RefreshTokenRepository(this.sharedDataSource);
  }

  // ── Shared services ─────────────────────────────────

  authService(): AuthService {
    return new AuthService(
      this.userRepository(),
      this.refreshTokenRepository(),
      this.userTenantRepository(),
      this.tenantRepository(),
    );
  }

  tenantService(): TenantService {
    return new TenantService(
      this.tenantRepository(),
      this.userTenantRepository(),
      this.invitationRepository(),
      this.userRepository(),
      this.tenantDataSourceManager,
    );
  }

  // ── Tenant-scoped services (per-tenant schema) ─────

  async contactService(tenantSlug: string): Promise<ContactService> {
    const ds = await this.tenantDataSourceManager.getDataSource(tenantSlug);
    const repo = new ContactRepository(ds);
    return new ContactService(repo);
  }
}
