import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createChatbotModule } from '../../modules/chatbot/chatbot.module.ts';
import { createFormFieldSchema, updateFormFieldSchema, reorderFormFieldsSchema } from '../../modules/chatbot/validators/chatbot.validator.ts';
import { validate } from '../../core/helpers/validator.ts';

export function chatbotFormFieldRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createChatbotModule(container);

  // Auth + requireTenant middleware applied in api.ts
  router.get('/', (c) => controller.listFormFields(c));
  router.post('/', validate('json', createFormFieldSchema), (c) => controller.createFormField(c));
  router.put('/reorder', validate('json', reorderFormFieldsSchema), (c) => controller.reorderFormFields(c));
  router.put('/:id', validate('json', updateFormFieldSchema), (c) => controller.updateFormField(c));
  router.delete('/:id', (c) => controller.deleteFormField(c));

  return router;
}
