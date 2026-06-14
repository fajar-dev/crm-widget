import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';

@Entity('chatbot_settings')
export class ChatbotSettings extends BaseEntity {
  @Column({ type: 'text', name: 'system_instruction' })
  systemInstruction!: string;

  @Column({ type: 'varchar', length: 100, name: 'model_name', default: 'gemini-2.0-flash' })
  modelName!: string;

  @Column({ type: 'varchar', length: 100, name: 'embedding_model', default: 'text-embedding-004' })
  embeddingModel!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  temperature!: number;

  @Column({ type: 'int', name: 'max_tokens', default: 1024 })
  maxTokens!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, name: 'top_p', default: 0.95 })
  topP!: number;

  @Column({ type: 'int', name: 'top_k', default: 40 })
  topK!: number;
}
