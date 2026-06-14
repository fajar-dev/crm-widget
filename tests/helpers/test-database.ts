import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../../src/modules/user/entities/user.entity.ts';
import { Tenant } from '../../src/modules/tenant/entities/tenant.entity.ts';
import { UserTenant } from '../../src/modules/tenant/entities/user-tenant.entity.ts';
import { TenantInvitation } from '../../src/modules/tenant/entities/tenant-invitation.entity.ts';
import { RefreshToken } from '../../src/modules/auth/entities/refresh-token.entity.ts';
import { Contact } from '../../src/modules/contacts/entities/contact.entity.ts';

let testDataSource: DataSource | null = null;

export async function createTestDataSource(): Promise<DataSource> {
  if (testDataSource?.isInitialized) {
    return testDataSource;
  }

  testDataSource = new DataSource({
    type: 'postgres',
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT) || 5432,
    username: process.env.TEST_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.TEST_DB_NAME || 'crm_db_test',
    dropSchema: true,
    synchronize: true,
    logging: false,
    entities: [User, Tenant, UserTenant, TenantInvitation, RefreshToken, Contact],
  });

  await testDataSource.initialize();
  return testDataSource;
}

export async function destroyTestDataSource(): Promise<void> {
  if (testDataSource?.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }
}

export async function clearAllTables(ds: DataSource): Promise<void> {
  const entities = ds.entityMetadatas;
  for (const entity of entities) {
    const repository = ds.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
  }
}
