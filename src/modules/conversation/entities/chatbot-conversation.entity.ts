import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';

@Entity('chatbot_conversations')
export class ChatbotConversation extends BaseEntity {
  @Column({ type: 'uuid', name: 'session_id' })
  sessionId!: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ type: 'int', name: 'total_messages', default: 0 })
  totalMessages!: number;

  @Column({ type: 'int', name: 'prompt_tokens', default: 0 })
  promptTokens!: number;

  @Column({ type: 'int', name: 'completion_tokens', default: 0 })
  completionTokens!: number;

  @Column({ type: 'int', name: 'total_tokens', default: 0 })
  totalTokens!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'timestamp', name: 'started_at', default: () => 'CURRENT_TIMESTAMP' })
  startedAt!: Date;

  @Column({ type: 'timestamp', name: 'ended_at', nullable: true })
  endedAt?: Date;

  @ManyToOne('ChatbotSession', 'conversations')
  @JoinColumn({ name: 'session_id' })
  session!: any;

  @OneToMany('ChatbotMessage', 'conversation')
  messages!: any[];
}
