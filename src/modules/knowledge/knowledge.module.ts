import type { Container } from '../../container.ts';
import { KnowledgeController } from './knowledge.controller.ts';

export function createKnowledgeModule(container: Container): KnowledgeController {
  return new KnowledgeController((tenantSlug) => container.knowledgeService(tenantSlug));
}
