import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../../src/modules/user/entities/user.entity.ts';
import { Tenant } from '../../src/modules/tenant/entities/tenant.entity.ts';
import { UserTenant } from '../../src/modules/tenant/entities/user-tenant.entity.ts';
import { TenantInvitation } from '../../src/modules/tenant/entities/tenant-invitation.entity.ts';
import { RefreshToken } from '../../src/modules/auth/entities/refresh-token.entity.ts';
import { WidgetSettings } from '../../src/modules/chatbot/entities/widget-settings.entity.ts';
import { ChatbotSettings } from '../../src/modules/chatbot/entities/chatbot-settings.entity.ts';
import { ChatbotFormField } from '../../src/modules/chatbot/entities/chatbot-form-field.entity.ts';
import { ChatbotSession } from '../../src/modules/chatbot/entities/chatbot-session.entity.ts';
import { ChatbotSessionValue } from '../../src/modules/chatbot/entities/chatbot-session-value.entity.ts';
import { ChatbotConversation } from '../../src/modules/conversation/entities/chatbot-conversation.entity.ts';
import { ChatbotMessage } from '../../src/modules/conversation/entities/chatbot-message.entity.ts';
import { KnowledgeCategory } from '../../src/modules/knowledge/entities/knowledge-category.entity.ts';
import { KnowledgeBase } from '../../src/modules/knowledge/entities/knowledge-base.entity.ts';

function getDbConfig() {
  return {
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT) || 5432,
    username: process.env.TEST_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.TEST_DB_NAME || 'crm_db_test',
  };
}

/**
 * Create shared DataSource for public schema (users, tenants, etc.)
 */
export async function createTestDataSource(): Promise<DataSource> {
  const existing = (globalThis as any).__test_shared_ds__ as DataSource | undefined;
  if (existing?.isInitialized) return existing;

  const ds = new DataSource({
    type: 'postgres',
    ...getDbConfig(),
    schema: 'public',
    dropSchema: true,
    synchronize: true,
    logging: false,
    entities: [User, Tenant, UserTenant, TenantInvitation, RefreshToken],
  });

  await ds.initialize();
  (globalThis as any).__test_shared_ds__ = ds;
  return ds;
}

/**
 * Create tenant DataSource for tenant-scoped entities (chatbot, knowledge, etc.)
 */
export async function createTestTenantDataSource(): Promise<DataSource> {
  const existing = (globalThis as any).__test_tenant_ds__ as DataSource | undefined;
  if (existing?.isInitialized) return existing;

  const schemaName = 'tenant_test_tenant';

  // Create schema first
  const tempDs = new DataSource({
    type: 'postgres',
    ...getDbConfig(),
    synchronize: false,
    logging: false,
    entities: [],
  });

  await tempDs.initialize();
  await tempDs.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  await tempDs.destroy();

  const ds = new DataSource({
    type: 'postgres',
    ...getDbConfig(),
    schema: schemaName,
    dropSchema: true,
    synchronize: true,
    logging: false,
    entities: [
      WidgetSettings,
      ChatbotSettings,
      ChatbotFormField,
      ChatbotSession,
      ChatbotSessionValue,
      ChatbotConversation,
      ChatbotMessage,
      KnowledgeCategory,
      KnowledgeBase,
    ],
  });

  await ds.initialize();
  (globalThis as any).__test_tenant_ds__ = ds;
  return ds;
}

export async function destroyTestDataSource(): Promise<void> {
  const tenantDs = (globalThis as any).__test_tenant_ds__ as DataSource | undefined;
  if (tenantDs?.isInitialized) {
    await tenantDs.destroy();
    (globalThis as any).__test_tenant_ds__ = null;
  }

  const sharedDs = (globalThis as any).__test_shared_ds__ as DataSource | undefined;
  if (sharedDs?.isInitialized) {
    await sharedDs.destroy();
    (globalThis as any).__test_shared_ds__ = null;
  }
}

export async function clearAllTables(ds: DataSource): Promise<void> {
  const entities = ds.entityMetadatas;
  for (const entity of entities) {
    const repository = ds.getRepository(entity.name);
    const schema = ds.options.schema || 'public';
    await repository.query(`TRUNCATE TABLE "${schema}"."${entity.tableName}" CASCADE`);
  }
}
