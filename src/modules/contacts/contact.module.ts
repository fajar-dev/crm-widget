import type { DataSource } from 'typeorm';
import { ContactRepository } from './repositories/contact.repository.ts';
import { ContactService } from './services/contact.service.ts';
import { createContactController } from './controllers/contact.controller.ts';

/**
 * Contact module factory.
 * Wires together repository → service → controller.
 *
 * @param dataSource - TypeORM DataSource
 * @returns Configured OpenAPIHono app with all contact CRUD routes
 */
export function createContactModule(dataSource: DataSource) {
  // Factory creates tenant-scoped instances per request
  const contactServiceFactory = (tenantId: string) => {
    const contactRepository = new ContactRepository(dataSource, tenantId);
    return new ContactService(contactRepository);
  };

  return createContactController(contactServiceFactory);
}
