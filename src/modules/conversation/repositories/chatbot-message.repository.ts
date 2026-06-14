import type { DataSource, FindManyOptions } from 'typeorm';
import { BaseRepository } from '../../../core/repositories/base.repository.ts';
import { ChatbotMessage } from '../entities/chatbot-message.entity.ts';

export class ChatbotMessageRepository extends BaseRepository<ChatbotMessage> {
  constructor(dataSource: DataSource) {
    super(dataSource, ChatbotMessage);
  }

  /**
   * Find all messages belonging to a specific conversation, ordered by createdAt ASC.
   */
  async findByConversationId(
    conversationId: string,
    options?: Omit<FindManyOptions<ChatbotMessage>, 'where' | 'order'>,
  ): Promise<ChatbotMessage[]> {
    return this.repository.find({
      ...options,
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }
}
