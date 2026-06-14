import type { ContactService } from './contact.service.ts';
import type { CreateContactInput, UpdateContactInput } from './validators/contact.validator.ts';
import type { PaginationQuery } from '../../core/validators/pagination.schema.ts';
import { ApiResponse } from '../../core/helpers/response.ts';

export class ContactController {
  constructor(private readonly serviceFactory: (tenantSlug: string) => Promise<ContactService>) {}

  async index(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const query = c.req.valid('query') as PaginationQuery;
    const service = await this.serviceFactory(tenantSlug);
    const result = await service.findAll(query);
    return ApiResponse.paginated(c, result.data, result.total, query.page, query.perPage);
  }

  async show(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const service = await this.serviceFactory(tenantSlug);
    const contact = await service.findById(id);
    return ApiResponse.success(c, contact);
  }

  async store(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const body = c.req.valid('json') as CreateContactInput;
    const service = await this.serviceFactory(tenantSlug);
    const contact = await service.create(body);
    return ApiResponse.created(c, contact, 'Contact created successfully');
  }

  async update(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const body = c.req.valid('json') as UpdateContactInput;
    const service = await this.serviceFactory(tenantSlug);
    const contact = await service.update(id, body);
    return ApiResponse.success(c, contact, 'Contact updated successfully');
  }

  async destroy(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const service = await this.serviceFactory(tenantSlug);
    await service.delete(id);
    return ApiResponse.success(c, null, 'Contact deleted successfully');
  }
}
