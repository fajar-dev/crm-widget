import { Entity, Column, Index } from 'typeorm';
import { TenantAwareEntity } from '../../core/interfaces/tenant-aware.interface.ts';
import { UserRole } from '../../core/interfaces/auth.interface.ts';

/**
 * User entity for authentication.
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

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
