import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';
import type { ChatbotSession } from './chatbot-session.entity.ts';

@Entity('chatbot_session_values')
export class ChatbotSessionValue extends BaseEntity {
  @Column({ type: 'uuid', name: 'session_id' })
  @Index()
  sessionId!: string;

  @Column({ type: 'varchar', length: 100, name: 'field_name' })
  fieldName!: string;

  @Column({ type: 'text', name: 'field_value' })
  fieldValue!: string;

  @ManyToOne('ChatbotSession', 'values', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: ChatbotSession;
}
