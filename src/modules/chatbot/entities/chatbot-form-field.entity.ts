import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';
import { FormFieldType } from '../enums/chatbot.enum.ts';

@Entity('chatbot_form_fields')
export class ChatbotFormField extends BaseEntity {
  @Column({ type: 'varchar', length: 100, name: 'field_name' })
  fieldName!: string;

  @Column({ type: 'varchar', length: 200 })
  label!: string;

  @Column({ type: 'enum', enum: FormFieldType, name: 'field_type' })
  fieldType!: FormFieldType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  placeholder?: string;

  @Column({ type: 'jsonb', nullable: true })
  options?: Record<string, any>;

  @Column({ type: 'boolean', name: 'is_required', default: true })
  isRequired!: boolean;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;
}
