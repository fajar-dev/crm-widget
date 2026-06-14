import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';
import { UserTenant } from './user-tenant.entity.ts';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 200 })
  company!: string;

  @Column({ type: 'varchar', length: 100 })
  @Index({ unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 20 })
  @Index({ unique: true })
  code!: string;

  @Column({ type: 'timestamp', name: 'code_expires_at', nullable: true })
  codeExpiresAt?: Date;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => UserTenant, (ut) => ut.tenant)
  members!: UserTenant[];
}
