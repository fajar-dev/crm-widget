import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';

@Entity('knowledge_categories')
export class KnowledgeCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany('KnowledgeBase', 'category')
  knowledgeBases!: any[];
}
