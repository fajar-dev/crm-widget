import type { DataSource } from 'typeorm';
import { BaseRepository } from '../../../core/repositories/base.repository.ts';
import { ChatbotSession } from '../entities/chatbot-session.entity.ts';

export class ChatbotSessionRepository extends BaseRepository<ChatbotSession> {
  constructor(dataSource: DataSource) {
    super(dataSource, ChatbotSession);
  }

  /**
   * Find a session by its unique token.
   */
  async findByToken(token: string): Promise<ChatbotSession | null> {
    return this.repository.findOne({
      where: { sessionToken: token },
    });
  }

  /**
   * Find a session by token with its related session values eagerly loaded.
   */
  async findByTokenWithValues(token: string): Promise<ChatbotSession | null> {
    return this.repository.findOne({
      where: { sessionToken: token },
      relations: ['values'],
    });
  }
}
