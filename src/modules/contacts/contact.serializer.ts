import type { Contact } from './contact.entity.ts';
import type { ContactStatus, ContactSource } from './contact.enum.ts';

export interface SerializedContact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  status: ContactStatus;
  source: ContactSource;
  notes: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ContactSerializer {
  static serialize(contact: Contact): SerializedContact {
    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: contact.fullName,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      company: contact.company ?? null,
      jobTitle: contact.jobTitle ?? null,
      status: contact.status,
      source: contact.source,
      notes: contact.notes ?? null,
      address: contact.address ?? null,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    };
  }

  static serializeMany(contacts: Contact[]): SerializedContact[] {
    return contacts.map(ContactSerializer.serialize);
  }
}
