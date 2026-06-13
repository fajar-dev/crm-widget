import type { IContactService, CreateContactInput, UpdateContactInput } from '../interfaces/contact.interface.ts';
import type { ContactRepository } from '../repositories/contact.repository.ts';
import { ContactSerializer, type SerializedContact } from '../serializers/contact.serializer.ts';
import type { PaginationQuery } from '../../../core/validators/pagination.schema.ts';

/**
 * Contact service implementing business logic.
 */
export class ContactService implements IContactService {
  constructor(
    private readonly contactRepository: ContactRepository,
  ) {}

  /**
   * Get paginated list of contacts with optional search.
   */
  async findAll(tenantId: string, query: PaginationQuery) {
    // If search term provided, use search method
    if (query.search) {
      const result = await this.contactRepository.search(
        query.search,
        query.page,
        query.perPage,
      );
      return {
        data: ContactSerializer.serializeMany(result.data),
        total: result.total,
      };
    }

    // Otherwise, paginated list with sorting
    const result = await this.contactRepository.paginate(
      query.page,
      query.perPage,
      {
        order: { [query.sortBy]: query.sortOrder } as any,
      },
    );

    return {
      data: ContactSerializer.serializeMany(result.data),
      total: result.total,
    };
  }

  /**
   * Get a single contact by ID.
   */
  async findById(tenantId: string, id: string): Promise<SerializedContact> {
    const contact = await this.contactRepository.findByIdOrFail(id, 'Contact');
    return ContactSerializer.serialize(contact);
  }

  /**
   * Create a new contact.
   */
  async create(tenantId: string, data: CreateContactInput): Promise<SerializedContact> {
    const contact = await this.contactRepository.create(data);
    return ContactSerializer.serialize(contact);
  }

  /**
   * Update an existing contact.
   */
  async update(tenantId: string, id: string, data: UpdateContactInput): Promise<SerializedContact> {
    const contact = await this.contactRepository.update(id, data, 'Contact');
    return ContactSerializer.serialize(contact);
  }

  /**
   * Delete a contact.
   */
  async delete(tenantId: string, id: string): Promise<void> {
    await this.contactRepository.delete(id, 'Contact');
  }
}
