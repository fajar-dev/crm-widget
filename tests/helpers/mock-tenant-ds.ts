import type { DataSource } from 'typeorm';
import type { TenantDataSourceManager } from '../../src/config/tenant-datasource.ts';

/**
 * Creates a mock TenantDataSourceManager for tests that don't need tenant schemas.
 * Used in auth/tenant tests where only shared DataSource is needed.
 */
export function createMockTenantDataSourceManager(tenantDs?: DataSource): TenantDataSourceManager {
  return {
    getDataSource: async (_slug: string) => {
      if (tenantDs) return tenantDs;
      throw new Error('No tenant DataSource configured in test');
    },
    createTenantSchema: async (_slug: string) => {
      // No-op in tests
    },
    dropTenantSchema: async (_slug: string) => {
      // No-op in tests
    },
    closeAll: async () => {
      // No-op in tests
    },
  } as unknown as TenantDataSourceManager;
}
