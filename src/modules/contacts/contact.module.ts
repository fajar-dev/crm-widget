import type { Container } from '../../container.ts';
import { ContactController } from './contact.controller.ts';

export function createContactModule(container: Container): ContactController {
  return new ContactController((tenantId) => container.contactService(tenantId));
}
