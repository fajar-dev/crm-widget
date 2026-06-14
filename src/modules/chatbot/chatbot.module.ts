import type { Container } from '../../container.ts';
import { ChatbotController } from './chatbot.controller.ts';

export function createChatbotModule(container: Container): ChatbotController {
  return new ChatbotController((tenantSlug) => container.chatbotService(tenantSlug));
}
