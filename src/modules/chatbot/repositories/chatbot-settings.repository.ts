import type { DataSource } from 'typeorm';
import { BaseRepository } from '../../../core/repositories/base.repository.ts';
import { ChatbotSettings } from '../entities/chatbot-settings.entity.ts';

export class ChatbotSettingsRepository extends BaseRepository<ChatbotSettings> {
  constructor(dataSource: DataSource) {
    super(dataSource, ChatbotSettings);
  }
}
