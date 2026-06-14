import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createChatbotModule } from '../../modules/chatbot/chatbot.module.ts';
import { paginationSchema } from '../../core/validators/pagination.schema.ts';
import { validate } from '../../core/helpers/validator.ts';

export function chatbotSessionRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createChatbotModule(container);

  // Auth + requireTenant middleware applied in api.ts
  router.get('/', validate('query', paginationSchema), (c) => controller.listSessions(c));
  router.get('/:id', (c) => controller.showSession(c));
  router.delete('/:id', (c) => controller.deleteSession(c));

  return router;
}
