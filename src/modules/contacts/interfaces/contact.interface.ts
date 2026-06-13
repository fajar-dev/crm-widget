import type { ContactStatus, ContactSource } from '../enums/contact.enum.ts';
import type { SerializedContact } from '../serializers/contact.serializer.ts';
import type { PaginationQuery } from '../../../core/validators/pagination.schema.ts';

export interface IContactService {
  findAll(tenantId: string, query: PaginationQuery): Promise<{ data: SerializedContact[]; total: number }>;
  findById(tenantId: string, id: string): Promise<SerializedContact>;
  create(tenantId: string, data: CreateContactInput): Promise<SerializedContact>;
  update(tenantId: string, id: string, data: UpdateContactInput): Promise<SerializedContact>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: ContactStatus;
  source?: ContactSource;
  notes?: string;
  address?: string;
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: ContactStatus;
  source?: ContactSource;
  notes?: string;
  address?: string;
}
