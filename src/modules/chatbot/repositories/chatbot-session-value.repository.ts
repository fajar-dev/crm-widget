import type { DataSource } from 'typeorm';
import { BaseRepository } from '../../../core/repositories/base.repository.ts';
import { ChatbotSessionValue } from '../entities/chatbot-session-value.entity.ts';

export class ChatbotSessionValueRepository extends BaseRepository<ChatbotSessionValue> {
  constructor(dataSource: DataSource) {
    super(dataSource, ChatbotSessionValue);
  }

  /**
   * Find all session values belonging to a specific session.
   */
  async findBySessionId(sessionId: string): Promise<ChatbotSessionValue[]> {
    return this.repository.find({
      where: { sessionId },
    });
  }
}
