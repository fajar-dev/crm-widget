import type { Container } from '../../container.ts';
import { ContactController } from './contact.controller.ts';

/**
 * Creates the Contacts module.
 * Wires the ContactController with the Container's contactService factory.
 */
export function createContactModule(container: Container) {
  const controller = new ContactController((tenantId) => container.contactService(tenantId));
  return controller.router;
}
