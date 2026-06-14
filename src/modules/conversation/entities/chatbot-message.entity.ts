import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';

@Entity('chatbot_messages')
export class ChatbotMessage extends BaseEntity {
  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'int', name: 'prompt_tokens', default: 0 })
  promptTokens!: number;

  @Column({ type: 'int', name: 'completion_tokens', default: 0 })
  completionTokens!: number;

  @Column({ type: 'int', name: 'total_tokens', default: 0 })
  totalTokens!: number;

  @Column({ type: 'int', name: 'latency_ms', nullable: true })
  latencyMs?: number;

  @Column({ type: 'varchar', length: 100, name: 'model_name', nullable: true })
  modelName?: string;

  @ManyToOne('ChatbotConversation', 'messages')
  @JoinColumn({ name: 'conversation_id' })
  conversation!: any;
}
