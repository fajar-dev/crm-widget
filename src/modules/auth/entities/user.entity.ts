import { Entity, Column, Index, BeforeInsert } from 'typeorm';
import { TenantAwareEntity } from '../../../core/interfaces/tenant-aware.interface.ts';
import { UserRole } from '../enums/auth.enum.ts';

/**
 * User entity for authentication.
 * Extends TenantAwareEntity for multi-tenant support.
 */
@Entity('users')
export class User extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, unique: false })
  @Index()
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role!: UserRole;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  /**
   * Get full name.
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
