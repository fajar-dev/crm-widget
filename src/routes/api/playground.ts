import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createChatModule } from '../../modules/chat/chat.module.ts';
import { validate } from '../../core/helpers/validator.ts';
import { playgroundSchema } from '../../modules/chat/validators/chat.validator.ts';

/**
 * Playground routes — requires auth + tenant middleware.
 */
export function playgroundRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createChatModule(container);

  // POST /playground — Authenticated chatbot playground
  router.post('/', validate('json', playgroundSchema), (c) => controller.playground(c));

  return router;
}
