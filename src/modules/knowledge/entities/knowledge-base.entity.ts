import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';

@Entity('knowledge_bases')
export class KnowledgeBase extends BaseEntity {
  @Column({ type: 'uuid', name: 'category_id' })
  categoryId!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'float4', array: true, nullable: true })
  embedding?: number[];

  @Column({ type: 'varchar', length: 30, name: 'entry_type', default: 'faq' })
  entryType!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @ManyToOne('KnowledgeCategory', 'knowledgeBases')
  @JoinColumn({ name: 'category_id' })
  category!: any;
}
