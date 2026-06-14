import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';

@Entity('widget_settings')
export class WidgetSettings extends BaseEntity {
  @Column({ type: 'text', name: 'welcome_message' })
  welcomeMessage!: string;

  @Column({ type: 'varchar', length: 500, name: 'icon_path', nullable: true })
  iconPath?: string;

  @Column({ type: 'varchar', length: 20, name: 'primary_color', default: '#6366f1' })
  primaryColor!: string;

  @Column({ type: 'varchar', length: 100, name: 'font_family', default: 'Inter' })
  fontFamily!: string;

  @Column({ type: 'int', name: 'session_timeout', default: 10 })
  sessionTimeout!: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;
}
