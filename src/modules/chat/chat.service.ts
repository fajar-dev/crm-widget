import type { ChatbotService } from '../chatbot/chatbot.service.ts';
import type { ConversationService } from '../conversation/conversation.service.ts';
import type { AgentService, AgentResponse } from './services/agent.service.ts';
import type { PublicChatConfig, ChatResponse } from './interfaces/chat.interface.ts';
import { MessageRole } from '../conversation/enums/conversation.enum.ts';
import { NotFoundException, BadRequestException, UnauthorizedException } from '../../core/exceptions/base.ts';

/**
 * Main chat orchestrator service.
 *
 * Coordinates between session management (ChatbotService),
 * conversation tracking (ConversationService), and the
 * ADK-powered agent (AgentService) for the public chat widget.
 */
export class ChatService {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly conversationService: ConversationService,
    private readonly agentService: AgentService,
  ) {}

  // ── Public Config ──────────────────────────────────

  /**
   * Get widget configuration for the public chat widget.
   * Returns settings + form fields needed to render the pre-chat form.
   */
  async getPublicConfig(): Promise<PublicChatConfig> {
    const widget = await this.chatbotService.getOrCreateWidget();
    const formFields = await this.chatbotService.listFormFields();

    return {
      tenantName: '', // Tenant name is resolved at the controller level
      welcomeMessage: widget.welcomeMessage,
      primaryColor: widget.primaryColor,
      fontFamily: widget.fontFamily,
      iconPath: widget.iconPath,
      isActive: widget.isActive,
      formFields: formFields.map((f) => ({
        fieldName: f.fieldName,
        label: f.label,
        fieldType: f.fieldType,
        placeholder: f.placeholder,
        options: f.options,
        isRequired: f.isRequired,
        sortOrder: f.sortOrder,
      })),
    };
  }

  // ── Session Management ─────────────────────────────

  /**
   * Create a new chat session after the user fills in the pre-chat form.
   */
  async createSession(
    formData: Record<string, string>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const widget = await this.chatbotService.getOrCreateWidget();

    if (!widget.isActive) {
      throw new BadRequestException('Chat widget is currently disabled');
    }

    return this.chatbotService.createSession(
      formData,
      ipAddress,
      userAgent,
      widget.sessionTimeout,
    );
  }

  /**
   * Get session details by token.
   */
  async getSession(token: string) {
    return this.chatbotService.getSessionByToken(token);
  }

  /**
   * Validate a session token, throwing if invalid or expired.
   */
  private async validateSessionToken(token: string): Promise<void> {
    if (!token) {
      throw new UnauthorizedException('Session token is required');
    }

    const isValid = await this.chatbotService.validateSession(token);
    if (!isValid) {
      throw new UnauthorizedException('Session has expired or is invalid');
    }
  }

  // ── Conversation Management ────────────────────────

  /**
   * Start a new conversation within a session.
   */
  async startConversation(sessionToken: string) {
    await this.validateSessionToken(sessionToken);

    const session = await this.chatbotService.getSessionByToken(sessionToken);
    return this.conversationService.createConversation(session.id);
  }

  /**
   * Send a message in a conversation and get the agent's response.
   */
  async sendMessage(
    sessionToken: string,
    conversationId: string,
    message: string,
  ): Promise<ChatResponse> {
    await this.validateSessionToken(sessionToken);

    // Get chatbot settings for the agent
    const chatbotSettings = await this.chatbotService.getOrCreateChatbot();

    // Get conversation history
    const conversation = await this.conversationService.getConversation(conversationId);
    const history = (conversation.messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Save the user message
    await this.conversationService.addMessage({
      conversationId,
      role: MessageRole.USER,
      content: message,
      modelName: chatbotSettings.modelName,
    });

    // Call the agent
    const agentResponse: AgentResponse = await this.agentService.chat(
      message,
      history,
      chatbotSettings.systemInstruction,
      {
        temperature: chatbotSettings.temperature,
        maxTokens: chatbotSettings.maxTokens,
        topP: chatbotSettings.topP,
        topK: chatbotSettings.topK,
      },
    );

    // Save the assistant message
    await this.conversationService.addMessage({
      conversationId,
      role: MessageRole.ASSISTANT,
      content: agentResponse.reply,
      promptTokens: agentResponse.promptTokens,
      completionTokens: agentResponse.completionTokens,
      totalTokens: agentResponse.totalTokens,
      latencyMs: agentResponse.latencyMs,
      modelName: chatbotSettings.modelName,
    });

    // Refresh session expiry on activity
    const widget = await this.chatbotService.getOrCreateWidget();
    await this.chatbotService.refreshSessionExpiry(sessionToken, widget.sessionTimeout);

    return {
      reply: agentResponse.reply,
      sources: agentResponse.sources,
      conversationId,
      promptTokens: agentResponse.promptTokens,
      completionTokens: agentResponse.completionTokens,
      totalTokens: agentResponse.totalTokens,
      latencyMs: agentResponse.latencyMs,
    };
  }

  /**
   * End a conversation.
   */
  async endConversation(sessionToken: string, conversationId: string) {
    await this.validateSessionToken(sessionToken);
    return this.conversationService.endConversation(conversationId);
  }

  // ── Playground (Authenticated) ─────────────────────

  /**
   * Playground chat — authenticated version that skips session validation.
   * Used by dashboard users to test the chatbot.
   */
  async playground(
    message: string,
    history: Array<{ role: string; content: string }>,
  ): Promise<AgentResponse> {
    const chatbotSettings = await this.chatbotService.getOrCreateChatbot();

    return this.agentService.chat(
      message,
      history,
      chatbotSettings.systemInstruction,
      {
        temperature: chatbotSettings.temperature,
        maxTokens: chatbotSettings.maxTokens,
        topP: chatbotSettings.topP,
        topK: chatbotSettings.topK,
      },
    );
  }
}
