import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createConversationModule } from '../../modules/conversation/conversation.module.ts';
import { paginationSchema } from '../../core/validators/pagination.schema.ts';
import { validate } from '../../core/helpers/validator.ts';

export function chatbotConversationRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createConversationModule(container);

  // Auth + requireTenant middleware applied in api.ts
  router.get('/', validate('query', paginationSchema), (c) => controller.listConversations(c));
  router.get('/:id', (c) => controller.getConversation(c));
  router.get('/:id/messages', validate('query', paginationSchema), (c) => controller.getMessages(c));
  router.delete('/:id', (c) => controller.deleteConversation(c));

  return router;
}
