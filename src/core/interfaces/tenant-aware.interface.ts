import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Interface for entities that support multi-tenancy.
 * All tenant-scoped entities MUST implement this interface.
 */
export interface ITenantAware {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Abstract base entity for all tenant-aware entities.
 * Provides common columns: id, tenantId, createdAt, updatedAt.
 *
 * Usage:
 * ```typescript
 * @Entity('contacts')
 * export class Contact extends TenantAwareEntity {
 *   @Column()
 *   firstName: string;
 * }
 * ```
 */
export abstract class TenantAwareEntity implements ITenantAware {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index()
  tenantId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
