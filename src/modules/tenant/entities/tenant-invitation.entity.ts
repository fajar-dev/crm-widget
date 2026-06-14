import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../core/interfaces/base.entity.ts';
import { UserRole } from '../../../core/interfaces/auth.interface.ts';

@Entity('tenant_invitations')
export class TenantInvitation extends BaseEntity {
  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  email!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role!: UserRole;

  @Column({ type: 'varchar', length: 100 })
  @Index({ unique: true })
  token!: string;

  @Column({ type: 'uuid', name: 'invited_by' })
  invitedBy!: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamp', name: 'accepted_at', nullable: true })
  acceptedAt?: Date;

  @ManyToOne('Tenant', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: any;

  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  get isAccepted(): boolean {
    return this.acceptedAt !== null && this.acceptedAt !== undefined;
  }
}
