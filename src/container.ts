import type { DataSource } from 'typeorm';
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
  constructor(private readonly dataSource: DataSource) {}

  // ── Global repositories ──────────────────────────────

  userRepository(): UserRepository {
    return new UserRepository(this.dataSource);
  }

  tenantRepository(): TenantRepository {
    return new TenantRepository(this.dataSource);
  }

  userTenantRepository(): UserTenantRepository {
    return new UserTenantRepository(this.dataSource);
  }

  invitationRepository(): TenantInvitationRepository {
    return new TenantInvitationRepository(this.dataSource);
  }

  refreshTokenRepository(): RefreshTokenRepository {
    return new RefreshTokenRepository(this.dataSource);
  }

  // ── Services ─────────────────────────────────────────

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
    );
  }

  contactService(tenantId: string): ContactService {
    const repo = new ContactRepository(this.dataSource, tenantId);
    return new ContactService(repo);
  }
}
