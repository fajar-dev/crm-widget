import type { ConversationService } from './conversation.service.ts';
import type { PaginationQuery } from '../../core/validators/pagination.schema.ts';
import { ApiResponse } from '../../core/helpers/response.ts';

export class ConversationController {
  constructor(private readonly serviceFactory: (tenantSlug: string) => Promise<ConversationService>) {}

  // ── Conversations ──────────────────────────────────

  async listConversations(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const query = c.req.valid('query') as PaginationQuery;
    const sessionId = c.req.query('session_id') as string | undefined;
    const service = await this.serviceFactory(tenantSlug);
    const result = await service.listConversations(query, sessionId);
    return ApiResponse.paginated(c, result.data, result.total, query.page, query.perPage);
  }

  async getConversation(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const service = await this.serviceFactory(tenantSlug);
    const conversation = await service.getConversation(id);
    return ApiResponse.success(c, conversation);
  }

  async getMessages(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const query = c.req.valid('query') as PaginationQuery;
    const service = await this.serviceFactory(tenantSlug);
    const result = await service.getConversationMessages(id, query);
    return ApiResponse.paginated(c, result.data, result.total, query.page, query.perPage);
  }

  async deleteConversation(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const service = await this.serviceFactory(tenantSlug);
    await service.deleteConversation(id);
    return ApiResponse.success(c, null, 'Conversation deleted successfully');
  }
}
