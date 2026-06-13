import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createContactModule } from '../../modules/contacts/contact.module.ts';
import { createContactSchema, updateContactSchema } from '../../modules/contacts/validators/contact.validator.ts';
import { paginationSchema } from '../../core/validators/pagination.schema.ts';
import { validate } from '../../core/helpers/validator.ts';
import { authMiddleware } from '../../core/middlewares/auth.middleware.ts';

export function contactRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createContactModule(container);

  router.use('/*', authMiddleware);
  router.get('/', validate('query', paginationSchema), (c) => controller.index(c));
  router.get('/:id', (c) => controller.show(c));
  router.post('/', validate('json', createContactSchema), (c) => controller.store(c));
  router.put('/:id', validate('json', updateContactSchema), (c) => controller.update(c));
  router.delete('/:id', (c) => controller.destroy(c));

  return router;
}
