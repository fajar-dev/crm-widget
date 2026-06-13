import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ContactService } from '../services/contact.service.ts';
import { createContactSchema, updateContactSchema, contactResponseSchema } from '../validators/contact.validators.ts';
import type { CreateContactInput, UpdateContactInput } from '../validators/contact.validators.ts';
import { paginationSchema, type PaginationQuery } from '../../../core/validators/pagination.schema.ts';
import { validationHook } from '../../../core/helpers/validator.ts';
import { ApiResponse } from '../../../core/helpers/response.ts';
import { authMiddleware } from '../../../core/middlewares/auth.middleware.ts';

type AppEnv = {
  Variables: {
    tenantId: string;
    user: { id: string; tenantId: string; email: string; role: string };
  };
};

/**
 * Creates the contact controller with all CRUD routes.
 * Factory pattern for dependency injection.
 */
export function createContactController(
  contactServiceFactory: (tenantId: string) => ContactService,
) {
  const app = new OpenAPIHono<AppEnv>();

  // Apply auth middleware to all contact routes
  app.use('/*', authMiddleware);

  // GET / - List contacts (paginated)
  const listRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['Contacts'],
    summary: 'List all contacts (paginated)',
    security: [{ Bearer: [] }],
    request: {
      query: paginationSchema,
    },
    responses: {
      200: {
        description: 'Paginated list of contacts',
        content: { 'application/json': { schema: z.object({ success: z.boolean(), statusCode: z.number(), message: z.string(), data: z.array(contactResponseSchema), meta: z.any() }) } },
      },
    },
  });

  app.openapi(listRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const query = c.req.valid('query') as PaginationQuery;
    const contactService = contactServiceFactory(tenantId);
    const result = await contactService.findAll(tenantId, query);
    return ApiResponse.paginated(
      c,
      result.data,
      result.total,
      query.page,
      query.perPage,
    ) as any;
  }, validationHook);

  // GET /:id - Get contact by ID
  const getRoute = createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Contacts'],
    summary: 'Get contact by ID',
    security: [{ Bearer: [] }],
    request: {
      params: z.object({ id: z.string().uuid().openapi({ description: 'Contact ID', example: '550e8400-e29b-41d4-a716-446655440000' }) }),
    },
    responses: {
      200: {
        description: 'Contact details',
        content: { 'application/json': { schema: z.object({ success: z.boolean(), statusCode: z.number(), message: z.string(), data: contactResponseSchema }) } },
      },
      404: { description: 'Contact not found' },
    },
  });

  app.openapi(getRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const { id } = c.req.valid('param') as { id: string };
    const contactService = contactServiceFactory(tenantId);
    const contact = await contactService.findById(tenantId, id);
    return ApiResponse.success(c, contact) as any;
  }, validationHook);

  // POST / - Create contact
  const createRoute_ = createRoute({
    method: 'post',
    path: '/',
    tags: ['Contacts'],
    summary: 'Create a new contact',
    security: [{ Bearer: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: createContactSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Contact created successfully',
        content: { 'application/json': { schema: z.object({ success: z.boolean(), statusCode: z.number(), message: z.string(), data: contactResponseSchema }) } },
      },
      422: { description: 'Validation error' },
    },
  });

  app.openapi(createRoute_, async (c) => {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as CreateContactInput;
    const contactService = contactServiceFactory(tenantId);
    const contact = await contactService.create(tenantId, body);
    return ApiResponse.created(c, contact, 'Contact created successfully') as any;
  }, validationHook);

  // PUT /:id - Update contact
  const updateRoute = createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['Contacts'],
    summary: 'Update a contact',
    security: [{ Bearer: [] }],
    request: {
      params: z.object({ id: z.string().uuid().openapi({ description: 'Contact ID' }) }),
      body: {
        content: {
          'application/json': {
            schema: updateContactSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Contact updated successfully',
        content: { 'application/json': { schema: z.object({ success: z.boolean(), statusCode: z.number(), message: z.string(), data: contactResponseSchema }) } },
      },
      404: { description: 'Contact not found' },
      422: { description: 'Validation error' },
    },
  });

  app.openapi(updateRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const { id } = c.req.valid('param') as { id: string };
    const body = c.req.valid('json') as UpdateContactInput;
    const contactService = contactServiceFactory(tenantId);
    const contact = await contactService.update(tenantId, id, body);
    return ApiResponse.success(c, contact, 'Contact updated successfully') as any;
  }, validationHook);

  // DELETE /:id - Delete contact
  const deleteRoute = createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Contacts'],
    summary: 'Delete a contact',
    security: [{ Bearer: [] }],
    request: {
      params: z.object({ id: z.string().uuid().openapi({ description: 'Contact ID' }) }),
    },
    responses: {
      200: {
        description: 'Contact deleted successfully',
        content: { 'application/json': { schema: z.object({ success: z.boolean(), statusCode: z.number(), message: z.string(), data: z.null() }) } },
      },
      404: { description: 'Contact not found' },
    },
  });

  app.openapi(deleteRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const { id } = c.req.valid('param') as { id: string };
    const contactService = contactServiceFactory(tenantId);
    await contactService.delete(tenantId, id);
    return ApiResponse.success(c, null, 'Contact deleted successfully') as any;
  }, validationHook);

  return app;
}
