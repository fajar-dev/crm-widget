import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { EnvConfig } from './config.ts';
import { Contact } from '../modules/contacts/entities/contact.entity.ts';
import { WidgetSettings } from '../modules/chatbot/entities/widget-settings.entity.ts';
import { ChatbotSettings } from '../modules/chatbot/entities/chatbot-settings.entity.ts';
import { ChatbotFormField } from '../modules/chatbot/entities/chatbot-form-field.entity.ts';
import { ChatbotSession } from '../modules/chatbot/entities/chatbot-session.entity.ts';
import { ChatbotSessionValue } from '../modules/chatbot/entities/chatbot-session-value.entity.ts';
import { ChatbotConversation } from '../modules/conversation/entities/chatbot-conversation.entity.ts';
import { ChatbotMessage } from '../modules/conversation/entities/chatbot-message.entity.ts';
import { KnowledgeCategory } from '../modules/knowledge/entities/knowledge-category.entity.ts';
import { KnowledgeBase } from '../modules/knowledge/entities/knowledge-base.entity.ts';

/**
 * List of entities that live in per-tenant schemas.
 * Add new tenant-scoped entities here.
 */
const TENANT_ENTITIES = [
  Contact,
  WidgetSettings,
  ChatbotSettings,
  ChatbotFormField,
  ChatbotSession,
  ChatbotSessionValue,
  ChatbotConversation,
  ChatbotMessage,
  KnowledgeCategory,
  KnowledgeBase,
];

/**
 * Manages per-tenant PostgreSQL schema connections.
 * Each tenant gets its own schema: tenant_<slug>
 */
export class TenantDataSourceManager {
  private cache = new Map<string, DataSource>();

  constructor(private readonly dbConfig: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    logging: boolean;
  }) {}

  /**
   * Get or create a DataSource for a tenant's schema.
   */
  async getDataSource(tenantSlug: string): Promise<DataSource> {
    const schemaName = this.schemaName(tenantSlug);

    const cached = this.cache.get(schemaName);
    if (cached?.isInitialized) return cached;

    const ds = new DataSource({
      type: 'postgres',
      host: this.dbConfig.host,
      port: this.dbConfig.port,
      username: this.dbConfig.username,
      password: this.dbConfig.password,
      database: this.dbConfig.database,
      schema: schemaName,
      synchronize: false,
      logging: this.dbConfig.logging,
      entities: TENANT_ENTITIES,
    });

    await ds.initialize();
    this.cache.set(schemaName, ds);
    return ds;
  }

  /**
   * Create a new schema and synchronize tables for a new tenant.
   */
  async createTenantSchema(tenantSlug: string): Promise<void> {
    const schemaName = this.schemaName(tenantSlug);

    // Create schema using a raw query on any existing connection
    const tempDs = new DataSource({
      type: 'postgres',
      host: this.dbConfig.host,
      port: this.dbConfig.port,
      username: this.dbConfig.username,
      password: this.dbConfig.password,
      database: this.dbConfig.database,
      synchronize: false,
      logging: this.dbConfig.logging,
      entities: [],
    });

    await tempDs.initialize();
    await tempDs.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    await tempDs.query(`SET search_path TO "${schemaName}"`);
    await tempDs.query(`CREATE EXTENSION IF NOT EXISTS vector SCHEMA "${schemaName}"`);
    await tempDs.destroy();

    // Now create a DataSource with the new schema and synchronize
    const tenantDs = new DataSource({
      type: 'postgres',
      host: this.dbConfig.host,
      port: this.dbConfig.port,
      username: this.dbConfig.username,
      password: this.dbConfig.password,
      database: this.dbConfig.database,
      schema: schemaName,
      synchronize: true,
      logging: this.dbConfig.logging,
      entities: TENANT_ENTITIES,
    });

    await tenantDs.initialize();
    this.cache.set(schemaName, tenantDs);
  }

  /**
   * Drop a tenant's schema entirely.
   */
  async dropTenantSchema(tenantSlug: string): Promise<void> {
    const schemaName = this.schemaName(tenantSlug);

    const cached = this.cache.get(schemaName);
    if (cached?.isInitialized) {
      await cached.destroy();
      this.cache.delete(schemaName);
    }

    const tempDs = new DataSource({
      type: 'postgres',
      host: this.dbConfig.host,
      port: this.dbConfig.port,
      username: this.dbConfig.username,
      password: this.dbConfig.password,
      database: this.dbConfig.database,
      synchronize: false,
      logging: false,
      entities: [],
    });

    await tempDs.initialize();
    await tempDs.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await tempDs.destroy();
  }

  /**
   * Close all cached connections.
   */
  async closeAll(): Promise<void> {
    for (const [key, ds] of this.cache.entries()) {
      if (ds.isInitialized) await ds.destroy();
      this.cache.delete(key);
    }
  }

  /**
   * Convert tenant slug to schema name.
   */
  private schemaName(slug: string): string {
    return `tenant_${slug.replace(/-/g, '_')}`;
  }
}
