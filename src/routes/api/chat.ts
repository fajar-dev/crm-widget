import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createChatModule } from '../../modules/chat/chat.module.ts';
import { validate } from '../../core/helpers/validator.ts';
import { sendMessageSchema, startSessionSchema } from '../../modules/chat/validators/chat.validator.ts';

/**
 * Public chat routes — NO auth middleware.
 * Session-based authentication via X-Session-Token header.
 */
export function publicChatRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createChatModule(container);

  // GET /chat/:tenantSlug/config — Widget config
  router.get('/:tenantSlug/config', (c) => controller.publicConfig(c));

  // POST /chat/:tenantSlug/sessions — Start session (pre-chat form)
  router.post('/:tenantSlug/sessions', validate('json', startSessionSchema), (c) => controller.publicStartSession(c));

  // GET /chat/:tenantSlug/sessions/:token — Get session by token
  router.get('/:tenantSlug/sessions/:token', (c) => controller.publicGetSession(c));

  // POST /chat/:tenantSlug/conversations — Start conversation
  router.post('/:tenantSlug/conversations', (c) => controller.publicStartConversation(c));

  // POST /chat/:tenantSlug/conversations/:convId/messages — Send message
  router.post(
    '/:tenantSlug/conversations/:convId/messages',
    validate('json', sendMessageSchema),
    (c) => controller.publicSendMessage(c),
  );

  // POST /chat/:tenantSlug/conversations/:convId/end — End conversation
  router.post('/:tenantSlug/conversations/:convId/end', (c) => controller.publicEndConversation(c));

  return router;
}
