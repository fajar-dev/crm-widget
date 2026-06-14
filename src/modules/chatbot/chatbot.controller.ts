import type { ChatbotService } from './chatbot.service.ts';
import type { UpdateWidgetSettingsInput, UpdateChatbotSettingsInput, CreateFormFieldInput, UpdateFormFieldInput, ReorderFormFieldsInput } from './validators/chatbot.validator.ts';
import type { PaginationQuery } from '../../core/validators/pagination.schema.ts';
import { ApiResponse } from '../../core/helpers/response.ts';

export class ChatbotController {
  constructor(private readonly serviceFactory: (tenantSlug: string) => Promise<ChatbotService>) {}

  // ── Widget Settings ─────────────────────────────────

  async showWidgetSettings(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const service = await this.serviceFactory(tenantSlug);
    const settings = await service.getOrCreateWidget();
    return ApiResponse.success(c, settings);
  }

  async updateWidgetSettings(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const body = c.req.valid('json') as UpdateWidgetSettingsInput;
    const service = await this.serviceFactory(tenantSlug);
    const settings = await service.updateWidget(body);
    return ApiResponse.success(c, settings, 'Widget settings updated successfully');
  }

  // ── Chatbot Settings ────────────────────────────────

  async showChatbotSettings(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const service = await this.serviceFactory(tenantSlug);
    const settings = await service.getOrCreateChatbot();
    return ApiResponse.success(c, settings);
  }

  async updateChatbotSettings(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const body = c.req.valid('json') as UpdateChatbotSettingsInput;
    const service = await this.serviceFactory(tenantSlug);
    const settings = await service.updateChatbot(body);
    return ApiResponse.success(c, settings, 'Chatbot settings updated successfully');
  }

  // ── Form Fields ─────────────────────────────────────

  async listFormFields(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const service = await this.serviceFactory(tenantSlug);
    const fields = await service.listFormFields();
    return ApiResponse.success(c, fields);
  }

  async createFormField(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const body = c.req.valid('json') as CreateFormFieldInput;
    const service = await this.serviceFactory(tenantSlug);
    const field = await service.createFormField(body);
    return ApiResponse.created(c, field, 'Form field created successfully');
  }

  async updateFormField(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const body = c.req.valid('json') as UpdateFormFieldInput;
    const service = await this.serviceFactory(tenantSlug);
    const field = await service.updateFormField(id, body);
    return ApiResponse.success(c, field, 'Form field updated successfully');
  }

  async deleteFormField(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const service = await this.serviceFactory(tenantSlug);
    await service.deleteFormField(id);
    return ApiResponse.success(c, null, 'Form field deleted successfully');
  }

  async reorderFormFields(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const body = c.req.valid('json') as ReorderFormFieldsInput;
    const service = await this.serviceFactory(tenantSlug);
    const fields = await service.reorderFormFields(body.items);
    return ApiResponse.success(c, fields, 'Form fields reordered successfully');
  }

  // ── Sessions ────────────────────────────────────────

  async listSessions(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const query = c.req.valid('query') as PaginationQuery;
    const service = await this.serviceFactory(tenantSlug);
    const result = await service.listSessions(query);
    return ApiResponse.paginated(c, result.data, result.total, query.page, query.perPage);
  }

  async showSession(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const service = await this.serviceFactory(tenantSlug);
    const session = await service.getSessionById(id);
    return ApiResponse.success(c, session);
  }

  async deleteSession(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const service = await this.serviceFactory(tenantSlug);
    await service.deleteSession(id);
    return ApiResponse.success(c, null, 'Session deleted successfully');
  }
}
