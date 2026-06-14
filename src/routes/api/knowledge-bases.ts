import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createKnowledgeModule } from '../../modules/knowledge/knowledge.module.ts';
import { updateKnowledgeBaseSchema } from '../../modules/knowledge/validators/knowledge.validator.ts';
import { validate } from '../../core/helpers/validator.ts';

export function knowledgeBaseRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createKnowledgeModule(container);

  // Auth + requireTenant middleware applied in api.ts
  router.get('/:id', (c) => controller.getKnowledgeBase(c));
  router.put('/:id', validate('json', updateKnowledgeBaseSchema), (c) => controller.updateKnowledgeBase(c));
  router.delete('/:id', (c) => controller.deleteKnowledgeBase(c));

  return router;
}
