import type { CreateMessageInput } from './interfaces/conversation.interface.ts';
import type { ChatbotConversationRepository } from './repositories/chatbot-conversation.repository.ts';
import type { ChatbotMessageRepository } from './repositories/chatbot-message.repository.ts';
import { ConversationSerializer, type SerializedConversation, type SerializedMessage } from './serializers/conversation.serializer.ts';
import { ConversationStatus } from './enums/conversation.enum.ts';
import { NotFoundException } from '../../core/exceptions/base.ts';
import type { PaginationQuery } from '../../core/validators/pagination.schema.ts';

export class ConversationService {
  constructor(
    private readonly conversationRepo: ChatbotConversationRepository,
    private readonly messageRepo: ChatbotMessageRepository,
  ) {}

  // ── Conversations ──────────────────────────────────

  async listConversations(query: PaginationQuery, sessionId?: string) {
    const where = sessionId ? { sessionId } : {};
    const result = await this.conversationRepo.paginate(query.page, query.perPage, {
      where: where as any,
      order: { [query.sortBy]: query.sortOrder } as any,
    });
    return { data: ConversationSerializer.conversationCollection(result.data), total: result.total };
  }

  async getConversation(id: string): Promise<SerializedConversation & { messages: SerializedMessage[] }> {
    const conversation = await this.conversationRepo.findWithMessages(id);
    if (!conversation) {
      throw new NotFoundException(`ChatbotConversation with id '${id}' not found`);
    }
    const serialized = ConversationSerializer.serializeConversation(conversation);
    return {
      ...serialized,
      messages: ConversationSerializer.messageCollection(conversation.messages ?? []),
    };
  }

  async getConversationMessages(id: string, query: PaginationQuery) {
    await this.conversationRepo.findByIdOrFail(id, 'ChatbotConversation');
    const result = await this.messageRepo.paginate(query.page, query.perPage, {
      where: { conversationId: id } as any,
      order: { createdAt: 'ASC' } as any,
    });
    return { data: ConversationSerializer.messageCollection(result.data), total: result.total };
  }

  async createConversation(sessionId: string): Promise<SerializedConversation> {
    const conversation = await this.conversationRepo.create({
      sessionId,
      status: ConversationStatus.ACTIVE,
      totalMessages: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      startedAt: new Date(),
    });
    return ConversationSerializer.serializeConversation(conversation);
  }

  async endConversation(id: string): Promise<SerializedConversation> {
    const conversation = await this.conversationRepo.update(id, {
      status: ConversationStatus.ENDED,
      endedAt: new Date(),
    }, 'ChatbotConversation');
    return ConversationSerializer.serializeConversation(conversation);
  }

  async addMessage(input: CreateMessageInput): Promise<SerializedMessage> {
    // Ensure conversation exists
    const conversation = await this.conversationRepo.findByIdOrFail(input.conversationId, 'ChatbotConversation');

    // Create message
    const message = await this.messageRepo.create({
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      promptTokens: input.promptTokens ?? 0,
      completionTokens: input.completionTokens ?? 0,
      totalTokens: input.totalTokens ?? 0,
      latencyMs: input.latencyMs,
      modelName: input.modelName,
    });

    // Increment conversation totals
    await this.conversationRepo.update(conversation.id, {
      totalMessages: conversation.totalMessages + 1,
      promptTokens: conversation.promptTokens + (input.promptTokens ?? 0),
      completionTokens: conversation.completionTokens + (input.completionTokens ?? 0),
      totalTokens: conversation.totalTokens + (input.totalTokens ?? 0),
    }, 'ChatbotConversation');

    return ConversationSerializer.serializeMessage(message);
  }

  async deleteConversation(id: string): Promise<void> {
    await this.conversationRepo.delete(id, 'ChatbotConversation');
  }
}
