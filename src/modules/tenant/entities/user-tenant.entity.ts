import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';
import { UserRole } from '../../../core/interfaces/auth.interface.ts';
import { MembershipStatus } from '../enums/tenant.enum.ts';

@Entity('user_tenants')
@Unique(['userId', 'tenantId'])
export class UserTenant extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId!: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index()
  tenantId!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role!: UserRole;

  @Column({ type: 'enum', enum: MembershipStatus, default: MembershipStatus.ACTIVE })
  status!: MembershipStatus;

  @Column({ type: 'uuid', name: 'invited_by', nullable: true })
  invitedBy?: string;

  @Column({ type: 'timestamp', name: 'joined_at', nullable: true })
  joinedAt?: Date;

  @ManyToOne('User', 'tenants', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: any;

  @ManyToOne('Tenant', 'members', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: any;
}
