import { Hono } from 'hono';
import type { ContactService } from './contact.service.ts';
import { createContactSchema, updateContactSchema } from './contact.validator.ts';
import type { CreateContactInput, UpdateContactInput } from './contact.validator.ts';
import { paginationSchema, type PaginationQuery } from '../../core/validators/pagination.schema.ts';
import { validate } from '../../core/helpers/validator.ts';
import { ApiResponse } from '../../core/helpers/response.ts';
import { authMiddleware } from '../../core/middlewares/auth.middleware.ts';

/**
 * Contact controller — class-based with constructor DI.
 */
export class ContactController {
  public readonly router: Hono;

  constructor(private readonly serviceFactory: (tenantId: string) => ContactService) {
    this.router = new Hono();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.use('/*', authMiddleware);
    this.router.get('/', validate('query', paginationSchema), (c) => this.index(c));
    this.router.get('/:id', (c) => this.show(c));
    this.router.post('/', validate('json', createContactSchema), (c) => this.store(c));
    this.router.put('/:id', validate('json', updateContactSchema), (c) => this.update(c));
    this.router.delete('/:id', (c) => this.destroy(c));
  }

  private async index(c: any) {
    const tenantId = c.get('tenantId');
    const query = c.req.valid('query') as PaginationQuery;
    const service = this.serviceFactory(tenantId);
    const result = await service.findAll(tenantId, query);
    return ApiResponse.paginated(c, result.data, result.total, query.page, query.perPage);
  }

  private async show(c: any) {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const service = this.serviceFactory(tenantId);
    const contact = await service.findById(tenantId, id);
    return ApiResponse.success(c, contact);
  }

  private async store(c: any) {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as CreateContactInput;
    const service = this.serviceFactory(tenantId);
    const contact = await service.create(tenantId, body);
    return ApiResponse.created(c, contact, 'Contact created successfully');
  }

  private async update(c: any) {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = c.req.valid('json') as UpdateContactInput;
    const service = this.serviceFactory(tenantId);
    const contact = await service.update(tenantId, id, body);
    return ApiResponse.success(c, contact, 'Contact updated successfully');
  }

  private async destroy(c: any) {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const service = this.serviceFactory(tenantId);
    await service.delete(tenantId, id);
    return ApiResponse.success(c, null, 'Contact deleted successfully');
  }
}
