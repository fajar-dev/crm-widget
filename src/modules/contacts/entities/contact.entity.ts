import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from '../../../core/interfaces/tenant-aware.interface.ts';
import { ContactStatus, ContactSource } from '../enums/contact.enum.ts';

/**
 * Contact entity representing a CRM contact.
 * Extends TenantAwareEntity for automatic multi-tenant support.
 */
@Entity('contacts')
export class Contact extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  company?: string;

  @Column({ type: 'varchar', length: 100, name: 'job_title', nullable: true })
  jobTitle?: string;

  @Column({
    type: 'enum',
    enum: ContactStatus,
    default: ContactStatus.LEAD,
  })
  status!: ContactStatus;

  @Column({
    type: 'enum',
    enum: ContactSource,
    default: ContactSource.OTHER,
  })
  source!: ContactSource;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address?: string;

  /**
   * Get full name.
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
