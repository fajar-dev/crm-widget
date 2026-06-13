import type { DataSource } from 'typeorm';
import { UserRepository } from './repositories/user.repository.ts';
import { RefreshTokenRepository } from './repositories/refresh-token.repository.ts';
import { AuthService } from './services/auth.service.ts';
import { createAuthController } from './controllers/auth.controller.ts';

/**
 * Auth module factory.
 * Wires together repository → service → controller.
 *
 * @param dataSource - TypeORM DataSource
 * @returns Configured OpenAPIHono app with all auth routes
 */
export function createAuthModule(dataSource: DataSource) {
  // Factory creates tenant-scoped instances per request
  const authServiceFactory = (tenantId: string) => {
    const userRepository = new UserRepository(dataSource, tenantId);
    const refreshTokenRepository = new RefreshTokenRepository(dataSource, tenantId);
    return new AuthService(userRepository, refreshTokenRepository, tenantId);
  };

  return createAuthController(authServiceFactory);
}
