import { Hono } from 'hono';
import type { Container } from '../../container.ts';
import { createKnowledgeModule } from '../../modules/knowledge/knowledge.module.ts';
import { createCategorySchema, updateCategorySchema, createKnowledgeBaseSchema, bulkCreateKnowledgeBaseSchema } from '../../modules/knowledge/validators/knowledge.validator.ts';
import { validate } from '../../core/helpers/validator.ts';

export function knowledgeCategoryRoutes(container: Container): Hono {
  const router = new Hono();
  const controller = createKnowledgeModule(container);

  // Auth + requireTenant middleware applied in api.ts
  router.get('/', (c) => controller.listCategories(c));
  router.get('/:id', (c) => controller.getCategory(c));
  router.post('/', validate('json', createCategorySchema), (c) => controller.createCategory(c));
  router.put('/:id', validate('json', updateCategorySchema), (c) => controller.updateCategory(c));
  router.delete('/:id', (c) => controller.deleteCategory(c));

  // Nested KB routes under category
  router.get('/:catId/knowledge-bases', (c) => controller.listKnowledgeBases(c));
  router.post('/:catId/knowledge-bases', validate('json', createKnowledgeBaseSchema), (c) => controller.createKnowledgeBase(c));
  router.post('/:catId/knowledge-bases/bulk', validate('json', bulkCreateKnowledgeBaseSchema), (c) => controller.bulkCreateKnowledgeBases(c));

  return router;
}
