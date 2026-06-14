export interface CreateConversationInput {
  sessionId: string;
}

export interface CreateMessageInput {
  conversationId: string;
  role: string;
  content: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  modelName?: string;
}
