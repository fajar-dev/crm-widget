import type { ChatService } from './chat.service.ts';
import type { SendMessageInput, PlaygroundInput } from './validators/chat.validator.ts';
import { ApiResponse } from '../../core/helpers/response.ts';
import { BadRequestException } from '../../core/exceptions/base.ts';

/**
 * Controller for the public chat widget and authenticated playground.
 *
 * Public routes use tenantSlug from URL params + X-Session-Token header.
 * Playground route uses tenantSlug from JWT context.
 */
export class ChatController {
  constructor(
    private readonly chatServiceFactory: (tenantSlug: string) => Promise<ChatService>,
  ) {}

  // ── Public Handlers (No Auth) ──────────────────────

  /**
   * GET /chat/:tenantSlug/config
   * Returns widget configuration for the public chat widget.
   */
  async publicConfig(c: any) {
    const tenantSlug = c.req.param('tenantSlug');
    const service = await this.chatServiceFactory(tenantSlug);
    const config = await service.getPublicConfig();
    return ApiResponse.success(c, config);
  }

  /**
   * POST /chat/:tenantSlug/sessions
   * Creates a new chat session with pre-chat form data.
   */
  async publicStartSession(c: any) {
    const tenantSlug = c.req.param('tenantSlug');
    const formData = c.req.valid('json') as Record<string, string>;
    const ipAddress = c.req.header('X-Forwarded-For') ?? c.req.header('CF-Connecting-IP');
    const userAgent = c.req.header('User-Agent');

    const service = await this.chatServiceFactory(tenantSlug);
    const session = await service.createSession(formData, ipAddress, userAgent);
    return ApiResponse.created(c, session, 'Session created successfully');
  }

  /**
   * GET /chat/:tenantSlug/sessions/:token
   * Retrieves session details by token.
   */
  async publicGetSession(c: any) {
    const tenantSlug = c.req.param('tenantSlug');
    const token = c.req.param('token');

    const service = await this.chatServiceFactory(tenantSlug);
    const session = await service.getSession(token);
    return ApiResponse.success(c, session);
  }

  /**
   * POST /chat/:tenantSlug/conversations
   * Starts a new conversation within a session.
   * Requires X-Session-Token header.
   */
  async publicStartConversation(c: any) {
    const tenantSlug = c.req.param('tenantSlug');
    const sessionToken = this.getSessionToken(c);

    const service = await this.chatServiceFactory(tenantSlug);
    const conversation = await service.startConversation(sessionToken);
    return ApiResponse.created(c, conversation, 'Conversation started');
  }

  /**
   * POST /chat/:tenantSlug/conversations/:convId/messages
   * Sends a message in a conversation and returns the agent's response.
   * Requires X-Session-Token header.
   */
  async publicSendMessage(c: any) {
    const tenantSlug = c.req.param('tenantSlug');
    const convId = c.req.param('convId');
    const sessionToken = this.getSessionToken(c);
    const body = c.req.valid('json') as SendMessageInput;

    const service = await this.chatServiceFactory(tenantSlug);
    const response = await service.sendMessage(sessionToken, convId, body.message);
    return ApiResponse.success(c, response);
  }

  /**
   * POST /chat/:tenantSlug/conversations/:convId/end
   * Ends a conversation.
   * Requires X-Session-Token header.
   */
  async publicEndConversation(c: any) {
    const tenantSlug = c.req.param('tenantSlug');
    const convId = c.req.param('convId');
    const sessionToken = this.getSessionToken(c);

    const service = await this.chatServiceFactory(tenantSlug);
    const conversation = await service.endConversation(sessionToken, convId);
    return ApiResponse.success(c, conversation, 'Conversation ended');
  }

  // ── Auth Handler ───────────────────────────────────

  /**
   * POST /playground
   * Authenticated playground chat for dashboard testing.
   * Uses tenantSlug from JWT context.
   */
  async playground(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const body = c.req.valid('json') as PlaygroundInput;

    const service = await this.chatServiceFactory(tenantSlug);
    const response = await service.playground(body.message, body.history ?? []);
    return ApiResponse.success(c, response);
  }

  // ── Private Helpers ────────────────────────────────

  /**
   * Extract X-Session-Token header from request.
   */
  private getSessionToken(c: any): string {
    const token = c.req.header('X-Session-Token');
    if (!token) {
      throw new BadRequestException('X-Session-Token header is required');
    }
    return token;
  }
}
