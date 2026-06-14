import type { Container } from '../../container.ts';
import { ConversationController } from './conversation.controller.ts';

export function createConversationModule(container: Container): ConversationController {
  return new ConversationController((tenantSlug) => container.conversationService(tenantSlug));
}
