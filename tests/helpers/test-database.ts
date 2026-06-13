import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../../src/modules/auth/user.entity.ts';
import { RefreshToken } from '../../src/modules/auth/refresh-token.entity.ts';
import { Contact } from '../../src/modules/contacts/contact.entity.ts';

let testDataSource: DataSource | null = null;

/**
 * Creates or returns an existing test DataSource.
 * Uses PostgreSQL test database with dropSchema + synchronize
 * to ensure clean state on each test run.
 */
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
    entities: [User, RefreshToken, Contact],
  });

  await testDataSource.initialize();
  return testDataSource;
}

/**
 * Destroys the test DataSource connection.
 */
export async function destroyTestDataSource(): Promise<void> {
  if (testDataSource?.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }
}

/**
 * Truncates all tables in the test database.
 * Uses CASCADE to handle foreign key constraints.
 */
export async function clearAllTables(ds: DataSource): Promise<void> {
  const entities = ds.entityMetadatas;
  for (const entity of entities) {
    const repository = ds.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
  }
}
