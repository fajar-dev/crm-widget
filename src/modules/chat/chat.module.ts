import type { Container } from '../../container.ts';
import { ChatController } from './chat.controller.ts';

export function createChatModule(container: Container): ChatController {
  return new ChatController((tenantSlug) => container.chatService(tenantSlug));
}
