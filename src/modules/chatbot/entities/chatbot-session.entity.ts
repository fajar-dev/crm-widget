import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';

@Entity('chatbot_sessions')
export class ChatbotSession extends BaseEntity {
  @Column({ type: 'varchar', length: 100, name: 'session_token', unique: true })
  @Index()
  sessionToken!: string;

  @Column({ type: 'varchar', length: 45, name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamp', name: 'last_activity_at' })
  lastActivityAt!: Date;

  @OneToMany('ChatbotSessionValue', 'session')
  values!: any[];

  @OneToMany('ChatbotConversation', 'session')
  conversations!: any[];
}
