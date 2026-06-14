import type { DataSource } from 'typeorm';
import { BaseRepository } from '../../../core/repositories/base.repository.ts';
import { ChatbotConversation } from '../entities/chatbot-conversation.entity.ts';

export class ChatbotConversationRepository extends BaseRepository<ChatbotConversation> {
  constructor(dataSource: DataSource) {
    super(dataSource, ChatbotConversation);
  }

  /**
   * Find all conversations belonging to a specific session.
   */
  async findBySessionId(sessionId: string): Promise<ChatbotConversation[]> {
    return this.repository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find a conversation by ID with its messages relation loaded.
   */
  async findWithMessages(id: string): Promise<ChatbotConversation | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['messages'],
    });
  }
}
