import { Hono } from 'hono';
import type { DataSource } from 'typeorm';
import type { TenantDataSourceManager } from '../config/tenant-datasource.ts';
import { authMiddleware, requireTenant } from '../core/middlewares/auth.middleware.ts';
import { Container } from '../container.ts';
import { authRoutes } from './api/auth.ts';
import { tenantRoutes } from './api/tenants.ts';
import { contactRoutes } from './api/contacts.ts';
import { widgetSettingsRoutes } from './api/widget-settings.ts';
import { chatbotSettingsRoutes } from './api/chatbot-settings.ts';
import { chatbotFormFieldRoutes } from './api/chatbot-form-fields.ts';
import { chatbotSessionRoutes } from './api/chatbot-sessions.ts';
import { knowledgeCategoryRoutes } from './api/knowledge-categories.ts';
import { knowledgeBaseRoutes } from './api/knowledge-bases.ts';
import { chatbotConversationRoutes } from './api/chatbot-conversations.ts';
import { publicChatRoutes } from './api/chat.ts';
import { playgroundRoutes } from './api/playground.ts';

export function createApiRouter(sharedDataSource: DataSource, tenantDataSourceManager: TenantDataSourceManager) {
  const api = new Hono();
  const container = new Container(sharedDataSource, tenantDataSourceManager);

  // Auth routes — NO tenant middleware (public + auth-only)
  api.route('/auth', authRoutes(container));

  // Public chat routes — NO auth middleware (session-based)
  api.route('/chat', publicChatRoutes(container));

  // Tenant routes — auth required, NO tenant middleware
  api.route('/tenants', tenantRoutes(container));

  // Contact routes — auth + tenant required
  api.use('/contacts/*', authMiddleware, requireTenant);
  api.route('/contacts', contactRoutes(container));

  // Widget settings routes — auth + tenant required
  api.use('/widget-settings/*', authMiddleware, requireTenant);
  api.route('/widget-settings', widgetSettingsRoutes(container));

  // Chatbot settings routes — auth + tenant required
  api.use('/chatbot-settings/*', authMiddleware, requireTenant);
  api.route('/chatbot-settings', chatbotSettingsRoutes(container));

  // Chatbot form fields routes — auth + tenant required
  api.use('/chatbot-form-fields/*', authMiddleware, requireTenant);
  api.route('/chatbot-form-fields', chatbotFormFieldRoutes(container));

  // Chatbot sessions routes — auth + tenant required
  api.use('/chatbot-sessions/*', authMiddleware, requireTenant);
  api.route('/chatbot-sessions', chatbotSessionRoutes(container));

  // Knowledge categories routes — auth + tenant required
  api.use('/knowledge-categories/*', authMiddleware, requireTenant);
  api.route('/knowledge-categories', knowledgeCategoryRoutes(container));

  // Knowledge bases routes — auth + tenant required
  api.use('/knowledge-bases/*', authMiddleware, requireTenant);
  api.route('/knowledge-bases', knowledgeBaseRoutes(container));

  // Chatbot conversations routes — auth + tenant required
  api.use('/chatbot-conversations/*', authMiddleware, requireTenant);
  api.route('/chatbot-conversations', chatbotConversationRoutes(container));

  // Playground routes — auth + tenant required
  api.use('/playground/*', authMiddleware, requireTenant);
  api.route('/playground', playgroundRoutes(container));

  return api;
}
