import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config.ts';
import { User } from '../modules/user/entities/user.entity.ts';
import { Tenant } from '../modules/tenant/entities/tenant.entity.ts';
import { UserTenant } from '../modules/tenant/entities/user-tenant.entity.ts';
import { TenantInvitation } from '../modules/tenant/entities/tenant-invitation.entity.ts';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity.ts';

/**
 * Shared DataSource — public schema only.
 * Contains global entities: users, tenants, user_tenants, tenant_invitations, refresh_tokens.
 * Tenant-scoped entities (contacts, etc.) live in per-tenant schemas.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  schema: 'public',
  synchronize: config.DB_SYNCHRONIZE,
  logging: config.DB_LOGGING,
  entities: [User, Tenant, UserTenant, TenantInvitation, RefreshToken],
  migrations: [`${import.meta.dir}/../migrations/*.{ts,js}`],
  subscribers: [],
});

/**
 * Initialize shared database connection with retry logic.
 */
export async function initializeDatabase(): Promise<DataSource> {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await AppDataSource.initialize();
      console.log('✅ Shared database connected (public schema)');
      return AppDataSource;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt}/${MAX_RETRIES} failed:`, error);
      if (attempt === MAX_RETRIES) {
        throw new Error('Failed to connect to database after maximum retries');
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error('Unreachable');
}
