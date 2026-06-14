import type { ChatbotConversation } from '../entities/chatbot-conversation.entity.ts';
import type { ChatbotMessage } from '../entities/chatbot-message.entity.ts';

export interface SerializedConversation {
  id: string;
  sessionId: string;
  status: string;
  totalMessages: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  metadata: Record<string, unknown> | null;
  startedAt: string;
  endedAt: string | null;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number | null;
  modelName: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ConversationSerializer {
  static serializeConversation(entity: ChatbotConversation & { messages?: any[] }): SerializedConversation {
    return {
      id: entity.id,
      sessionId: entity.sessionId,
      status: entity.status,
      totalMessages: entity.totalMessages,
      promptTokens: entity.promptTokens,
      completionTokens: entity.completionTokens,
      totalTokens: entity.totalTokens,
      metadata: entity.metadata ?? null,
      startedAt: entity.startedAt.toISOString(),
      endedAt: entity.endedAt ? entity.endedAt.toISOString() : null,
      ...(entity.messages !== undefined && { messageCount: entity.messages.length }),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static conversationCollection(entities: ChatbotConversation[]): SerializedConversation[] {
    return entities.map(ConversationSerializer.serializeConversation);
  }

  static serializeMessage(entity: ChatbotMessage): SerializedMessage {
    return {
      id: entity.id,
      conversationId: entity.conversationId,
      role: entity.role,
      content: entity.content,
      promptTokens: entity.promptTokens,
      completionTokens: entity.completionTokens,
      totalTokens: entity.totalTokens,
      latencyMs: entity.latencyMs ?? null,
      modelName: entity.modelName ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static messageCollection(entities: ChatbotMessage[]): SerializedMessage[] {
    return entities.map(ConversationSerializer.serializeMessage);
  }
}
