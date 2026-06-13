import type { DataSource } from 'typeorm';
import { UserRepository } from './modules/auth/user.repository.ts';
import { RefreshTokenRepository } from './modules/auth/refresh-token.repository.ts';
import { AuthService } from './modules/auth/auth.service.ts';
import { ContactRepository } from './modules/contacts/contact.repository.ts';
import { ContactService } from './modules/contacts/contact.service.ts';

/**
 * Dependency Injection Container.
 * Centralizes the creation of all services with their dependencies.
 * Each service factory creates tenant-scoped instances per request.
 */
export class Container {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Create a tenant-scoped AuthService.
   */
  authService(tenantId: string): AuthService {
    const userRepo = new UserRepository(this.dataSource, tenantId);
    const refreshTokenRepo = new RefreshTokenRepository(this.dataSource, tenantId);
    return new AuthService(userRepo, refreshTokenRepo, tenantId);
  }

  /**
   * Create a tenant-scoped ContactService.
   */
  contactService(tenantId: string): ContactService {
    const repo = new ContactRepository(this.dataSource, tenantId);
    return new ContactService(repo);
  }
}
