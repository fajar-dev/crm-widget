import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createChatbotModule } from '../../modules/chatbot/chatbot.module.ts';
import { updateWidgetSettingsSchema } from '../../modules/chatbot/validators/chatbot.validator.ts';
import { validate } from '../../core/helpers/validator.ts';

export function widgetSettingsRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createChatbotModule(container);

  // Auth + requireTenant middleware applied in api.ts
  router.get('/', (c) => controller.showWidgetSettings(c));
  router.put('/', validate('json', updateWidgetSettingsSchema), (c) => controller.updateWidgetSettings(c));

  return router;
}
