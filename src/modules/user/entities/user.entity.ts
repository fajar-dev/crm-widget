import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';
import { UserTenant } from '../../tenant/entities/user-tenant.entity.ts';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index({ unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ type: 'varchar', length: 500, name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'uuid', name: 'last_active_tenant_id', nullable: true })
  lastActiveTenantId?: string;

  @OneToMany(() => UserTenant, (ut) => ut.user)
  tenants!: UserTenant[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
