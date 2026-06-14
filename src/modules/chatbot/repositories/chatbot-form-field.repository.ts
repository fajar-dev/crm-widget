import type { DataSource } from 'typeorm';
import { BaseRepository } from '../../../core/repositories/base.repository.ts';
import { ChatbotFormField } from '../entities/chatbot-form-field.entity.ts';

export class ChatbotFormFieldRepository extends BaseRepository<ChatbotFormField> {
  constructor(dataSource: DataSource) {
    super(dataSource, ChatbotFormField);
  }

  /**
   * Find all active form fields, ordered by sort_order ascending.
   */
  async findAllActive(): Promise<ChatbotFormField[]> {
    return this.repository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }
}
