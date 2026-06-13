import type { ContactService } from './contact.service.ts';
import type { CreateContactInput, UpdateContactInput } from './validators/contact.validator.ts';
import type { PaginationQuery } from '../../core/validators/pagination.schema.ts';
import { ApiResponse } from '../../core/helpers/response.ts';

export class ContactController {
  constructor(private readonly serviceFactory: (tenantId: string) => ContactService) {}

  async index(c: any) {
    const tenantId = c.get('tenantId');
    const query = c.req.valid('query') as PaginationQuery;
    const service = this.serviceFactory(tenantId);
    const result = await service.findAll(tenantId, query);
    return ApiResponse.paginated(c, result.data, result.total, query.page, query.perPage);
  }

  async show(c: any) {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const service = this.serviceFactory(tenantId);
    const contact = await service.findById(tenantId, id);
    return ApiResponse.success(c, contact);
  }

  async store(c: any) {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as CreateContactInput;
    const service = this.serviceFactory(tenantId);
    const contact = await service.create(tenantId, body);
    return ApiResponse.created(c, contact, 'Contact created successfully');
  }

  async update(c: any) {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = c.req.valid('json') as UpdateContactInput;
    const service = this.serviceFactory(tenantId);
    const contact = await service.update(tenantId, id, body);
    return ApiResponse.success(c, contact, 'Contact updated successfully');
  }

  async destroy(c: any) {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const service = this.serviceFactory(tenantId);
    await service.delete(tenantId, id);
    return ApiResponse.success(c, null, 'Contact deleted successfully');
  }
}
