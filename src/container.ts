import type { DataSource } from 'typeorm';
import type { TenantDataSourceManager } from './config/tenant-datasource.ts';
import { UserRepository } from './modules/user/repositories/user.repository.ts';
import { RefreshTokenRepository } from './modules/auth/repositories/refresh-token.repository.ts';
import { TenantRepository } from './modules/tenant/repositories/tenant.repository.ts';
import { UserTenantRepository } from './modules/tenant/repositories/user-tenant.repository.ts';
import { TenantInvitationRepository } from './modules/tenant/repositories/tenant-invitation.repository.ts';
import { AuthService } from './modules/auth/auth.service.ts';
import { TenantService } from './modules/tenant/tenant.service.ts';
import { ContactRepository } from './modules/contacts/repositories/contact.repository.ts';
import { ContactService } from './modules/contacts/contact.service.ts';
import { WidgetSettingsRepository } from './modules/chatbot/repositories/widget-settings.repository.ts';
import { ChatbotSettingsRepository } from './modules/chatbot/repositories/chatbot-settings.repository.ts';
import { ChatbotFormFieldRepository } from './modules/chatbot/repositories/chatbot-form-field.repository.ts';
import { ChatbotSessionRepository } from './modules/chatbot/repositories/chatbot-session.repository.ts';
import { ChatbotSessionValueRepository } from './modules/chatbot/repositories/chatbot-session-value.repository.ts';
import { ChatbotService } from './modules/chatbot/chatbot.service.ts';
import { KnowledgeCategoryRepository } from './modules/knowledge/repositories/knowledge-category.repository.ts';
import { KnowledgeBaseRepository } from './modules/knowledge/repositories/knowledge-base.repository.ts';
import { KnowledgeService } from './modules/knowledge/knowledge.service.ts';
import { ChatbotConversationRepository } from './modules/conversation/repositories/chatbot-conversation.repository.ts';
import { ChatbotMessageRepository } from './modules/conversation/repositories/chatbot-message.repository.ts';
import { ConversationService } from './modules/conversation/conversation.service.ts';
import { EmbeddingService } from './modules/chat/services/embedding.service.ts';
import { RetrievalService } from './modules/chat/services/retrieval.service.ts';
import { AgentService } from './modules/chat/services/agent.service.ts';
import { ChatService } from './modules/chat/chat.service.ts';
import { config } from './config/config.ts';

export class Container {
  constructor(
    private readonly sharedDataSource: DataSource,
    private readonly tenantDataSourceManager: TenantDataSourceManager,
  ) {}

  // ── Shared repositories (public schema) ─────────────

  userRepository(): UserRepository {
    return new UserRepository(this.sharedDataSource);
  }

  tenantRepository(): TenantRepository {
    return new TenantRepository(this.sharedDataSource);
  }

  userTenantRepository(): UserTenantRepository {
    return new UserTenantRepository(this.sharedDataSource);
  }

  invitationRepository(): TenantInvitationRepository {
    return new TenantInvitationRepository(this.sharedDataSource);
  }

  refreshTokenRepository(): RefreshTokenRepository {
    return new RefreshTokenRepository(this.sharedDataSource);
  }

  // ── Shared services ─────────────────────────────────

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
      this.tenantDataSourceManager,
    );
  }

  // ── Tenant-scoped services (per-tenant schema) ─────

  async contactService(tenantSlug: string): Promise<ContactService> {
    const ds = await this.tenantDataSourceManager.getDataSource(tenantSlug);
    const repo = new ContactRepository(ds);
    return new ContactService(repo);
  }

  async chatbotService(tenantSlug: string): Promise<ChatbotService> {
    const ds = await this.tenantDataSourceManager.getDataSource(tenantSlug);
    return new ChatbotService(
      new WidgetSettingsRepository(ds),
      new ChatbotSettingsRepository(ds),
      new ChatbotFormFieldRepository(ds),
      new ChatbotSessionRepository(ds),
      new ChatbotSessionValueRepository(ds),
    );
  }

  async knowledgeService(tenantSlug: string): Promise<KnowledgeService> {
    const ds = await this.tenantDataSourceManager.getDataSource(tenantSlug);
    return new KnowledgeService(
      new KnowledgeCategoryRepository(ds),
      new KnowledgeBaseRepository(ds),
      null,
    );
  }

  async conversationService(tenantSlug: string): Promise<ConversationService> {
    const ds = await this.tenantDataSourceManager.getDataSource(tenantSlug);
    return new ConversationService(
      new ChatbotConversationRepository(ds),
      new ChatbotMessageRepository(ds),
    );
  }

  async chatService(tenantSlug: string): Promise<ChatService> {
    const ds = await this.tenantDataSourceManager.getDataSource(tenantSlug);

    // Embedding service (uses Gemini embedding model)
    const embeddingService = new EmbeddingService();

    // Retrieval service (pgvector similarity search)
    const retrievalService = new RetrievalService(
      new KnowledgeBaseRepository(ds),
      embeddingService,
    );

    // Agent service (ADK-powered RAG agent)
    const agentService = new AgentService(
      retrievalService,
      config.GEMINI_MODEL,
      config.GEMINI_API_KEY,
    );

    // Chatbot + Conversation services
    const chatbotService = await this.chatbotService(tenantSlug);
    const conversationService = await this.conversationService(tenantSlug);

    return new ChatService(chatbotService, conversationService, agentService);
  }
}
