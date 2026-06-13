import type { IContactService, CreateContactInput, UpdateContactInput } from './interfaces/contact.interface.ts';
import type { ContactRepository } from './repositories/contact.repository.ts';
import { ContactSerializer, type SerializedContact } from './serializers/contact.serializer.ts';
import type { PaginationQuery } from '../../core/validators/pagination.schema.ts';

export class ContactService implements IContactService {
  constructor(private readonly contactRepository: ContactRepository) {}

  async findAll(_tenantId: string, query: PaginationQuery) {
    if (query.search) {
      const result = await this.contactRepository.search(query.search, query.page, query.perPage);
      return { data: ContactSerializer.serializeMany(result.data), total: result.total };
    }

    const result = await this.contactRepository.paginate(query.page, query.perPage, {
      order: { [query.sortBy]: query.sortOrder } as any,
    });
    return { data: ContactSerializer.serializeMany(result.data), total: result.total };
  }

  async findById(_tenantId: string, id: string): Promise<SerializedContact> {
    const contact = await this.contactRepository.findByIdOrFail(id, 'Contact');
    return ContactSerializer.serialize(contact);
  }

  async create(_tenantId: string, data: CreateContactInput): Promise<SerializedContact> {
    const contact = await this.contactRepository.create(data);
    return ContactSerializer.serialize(contact);
  }

  async update(_tenantId: string, id: string, data: UpdateContactInput): Promise<SerializedContact> {
    const contact = await this.contactRepository.update(id, data, 'Contact');
    return ContactSerializer.serialize(contact);
  }

  async delete(_tenantId: string, id: string): Promise<void> {
    await this.contactRepository.delete(id, 'Contact');
  }
}
