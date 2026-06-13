import type { DataSource } from 'typeorm';
import { UserRepository } from './modules/user/repositories/user.repository.ts';
import { RefreshTokenRepository } from './modules/auth/repositories/refresh-token.repository.ts';
import { AuthService } from './modules/auth/auth.service.ts';
import { ContactRepository } from './modules/contacts/repositories/contact.repository.ts';
import { ContactService } from './modules/contacts/contact.service.ts';

export class Container {
  constructor(private readonly dataSource: DataSource) {}

  authService(tenantId: string): AuthService {
    const userRepo = new UserRepository(this.dataSource, tenantId);
    const refreshTokenRepo = new RefreshTokenRepository(this.dataSource, tenantId);
    return new AuthService(userRepo, refreshTokenRepo, tenantId);
  }

  contactService(tenantId: string): ContactService {
    const repo = new ContactRepository(this.dataSource, tenantId);
    return new ContactService(repo);
  }
}
