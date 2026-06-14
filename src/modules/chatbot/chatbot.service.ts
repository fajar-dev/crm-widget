import type { IChatbotService, UpdateWidgetSettingsInput, UpdateChatbotSettingsInput, CreateFormFieldInput, UpdateFormFieldInput, ReorderFormFieldItem } from './interfaces/chatbot.interface.ts';
import type { WidgetSettingsRepository } from './repositories/widget-settings.repository.ts';
import type { ChatbotSettingsRepository } from './repositories/chatbot-settings.repository.ts';
import type { ChatbotFormFieldRepository } from './repositories/chatbot-form-field.repository.ts';
import type { ChatbotSessionRepository } from './repositories/chatbot-session.repository.ts';
import type { ChatbotSessionValueRepository } from './repositories/chatbot-session-value.repository.ts';
import { ChatbotSerializer, type SerializedWidgetSettings, type SerializedChatbotSettings, type SerializedFormField, type SerializedSession } from './serializers/chatbot.serializer.ts';
import { FormFieldType } from './enums/chatbot.enum.ts';
import { NotFoundException } from '../../core/exceptions/base.ts';
import type { PaginationQuery } from '../../core/validators/pagination.schema.ts';

export class ChatbotService implements IChatbotService {
  constructor(
    private readonly widgetSettingsRepo: WidgetSettingsRepository,
    private readonly chatbotSettingsRepo: ChatbotSettingsRepository,
    private readonly formFieldRepo: ChatbotFormFieldRepository,
    private readonly sessionRepo: ChatbotSessionRepository,
    private readonly sessionValueRepo: ChatbotSessionValueRepository,
  ) {}

  // ── Widget Settings ─────────────────────────────────

  async getOrCreateWidget(): Promise<SerializedWidgetSettings> {
    const existing = await this.widgetSettingsRepo.findAll();
    if (existing.length > 0) {
      return ChatbotSerializer.serializeWidgetSettings(existing[0]!);
    }
    const settings = await this.widgetSettingsRepo.create({
      welcomeMessage: 'Hello! How can we help you today?',
      primaryColor: '#6366f1',
      fontFamily: 'Inter',
      sessionTimeout: 10,
      isActive: true,
    });
    return ChatbotSerializer.serializeWidgetSettings(settings);
  }

  async updateWidget(data: UpdateWidgetSettingsInput): Promise<SerializedWidgetSettings> {
    const widget = await this.getOrCreateWidget();
    const updated = await this.widgetSettingsRepo.update(widget.id, data, 'WidgetSettings');
    return ChatbotSerializer.serializeWidgetSettings(updated);
  }

  // ── Chatbot Settings ────────────────────────────────

  async getOrCreateChatbot(): Promise<SerializedChatbotSettings> {
    const existing = await this.chatbotSettingsRepo.findAll();
    if (existing.length > 0) {
      return ChatbotSerializer.serializeChatbotSettings(existing[0]!);
    }
    const settings = await this.chatbotSettingsRepo.create({
      systemInstruction: 'You are a helpful customer support assistant.',
      modelName: 'gemini-2.0-flash',
      embeddingModel: 'text-embedding-004',
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.95,
      topK: 40,
    });
    return ChatbotSerializer.serializeChatbotSettings(settings);
  }

  async updateChatbot(data: UpdateChatbotSettingsInput): Promise<SerializedChatbotSettings> {
    const chatbot = await this.getOrCreateChatbot();
    const updated = await this.chatbotSettingsRepo.update(chatbot.id, data, 'ChatbotSettings');
    return ChatbotSerializer.serializeChatbotSettings(updated);
  }

  // ── Form Fields ─────────────────────────────────────

  async listFormFields(): Promise<SerializedFormField[]> {
    const fields = await this.formFieldRepo.findAllActive();
    return ChatbotSerializer.formFieldCollection(fields);
  }

  async createFormField(data: CreateFormFieldInput): Promise<SerializedFormField> {
    const field = await this.formFieldRepo.create(data);
    return ChatbotSerializer.serializeFormField(field);
  }

  async updateFormField(id: string, data: UpdateFormFieldInput): Promise<SerializedFormField> {
    const field = await this.formFieldRepo.update(id, data, 'ChatbotFormField');
    return ChatbotSerializer.serializeFormField(field);
  }

  async deleteFormField(id: string): Promise<void> {
    await this.formFieldRepo.delete(id, 'ChatbotFormField');
  }

  async reorderFormFields(items: ReorderFormFieldItem[]): Promise<SerializedFormField[]> {
    for (const item of items) {
      await this.formFieldRepo.update(item.id, { sortOrder: item.sortOrder }, 'ChatbotFormField');
    }
    const fields = await this.formFieldRepo.findAllActive();
    return ChatbotSerializer.formFieldCollection(fields);
  }

  // ── Sessions ────────────────────────────────────────

  async listSessions(query: PaginationQuery) {
    const result = await this.sessionRepo.paginate(query.page, query.perPage, {
      order: { [query.sortBy]: query.sortOrder } as any,
      relations: ['values'],
    });
    return { data: ChatbotSerializer.sessionCollection(result.data), total: result.total };
  }

  async getSessionById(id: string): Promise<SerializedSession> {
    const session = await this.sessionRepo.findByIdOrFail(id, 'ChatbotSession');
    const values = await this.sessionValueRepo.findBySessionId(session.id);
    (session as any).values = values;
    return ChatbotSerializer.serializeSession(session);
  }

  async deleteSession(id: string): Promise<void> {
    await this.sessionRepo.delete(id, 'ChatbotSession');
  }

  async createSession(
    formData: Record<string, string>,
    ipAddress?: string,
    userAgent?: string,
    sessionTimeout?: number,
  ): Promise<SerializedSession> {
    const timeoutMinutes = sessionTimeout ?? 10;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + timeoutMinutes * 60 * 1000);
    const sessionToken = this.generateToken();

    const session = await this.sessionRepo.create({
      sessionToken,
      ipAddress,
      userAgent,
      expiresAt,
      lastActivityAt: now,
    });

    // Save form data as session values
    for (const [fieldName, fieldValue] of Object.entries(formData)) {
      await this.sessionValueRepo.create({
        sessionId: session.id,
        fieldName,
        fieldValue,
      });
    }

    const values = await this.sessionValueRepo.findBySessionId(session.id);
    (session as any).values = values;
    return ChatbotSerializer.serializeSession(session);
  }

  async getSessionByToken(token: string): Promise<SerializedSession> {
    const session = await this.sessionRepo.findByTokenWithValues(token);
    if (!session) {
      throw new NotFoundException(`Session with token '${token}' not found`);
    }
    return ChatbotSerializer.serializeSession(session);
  }

  async validateSession(token: string): Promise<boolean> {
    const session = await this.sessionRepo.findByToken(token);
    if (!session) {
      return false;
    }
    return new Date() < session.expiresAt;
  }

  async refreshSessionExpiry(token: string, timeoutMinutes: number): Promise<void> {
    const session = await this.sessionRepo.findByToken(token);
    if (!session) {
      throw new NotFoundException(`Session with token '${token}' not found`);
    }
    const now = new Date();
    await this.sessionRepo.update(session.id, {
      expiresAt: new Date(now.getTime() + timeoutMinutes * 60 * 1000),
      lastActivityAt: now,
    }, 'ChatbotSession');
  }

  // ── Init Defaults ───────────────────────────────────

  async initDefaults(): Promise<void> {
    // Create default widget settings
    await this.getOrCreateWidget();

    // Create default chatbot settings
    await this.getOrCreateChatbot();

    // Create default form fields (name + email)
    const existingFields = await this.formFieldRepo.findAll();
    if (existingFields.length === 0) {
      await this.formFieldRepo.create({
        fieldName: 'name',
        label: 'Name',
        fieldType: FormFieldType.TEXT,
        placeholder: 'Enter your name',
        isRequired: true,
        sortOrder: 0,
        isActive: true,
      });
      await this.formFieldRepo.create({
        fieldName: 'email',
        label: 'Email',
        fieldType: FormFieldType.EMAIL,
        placeholder: 'Enter your email',
        isRequired: true,
        sortOrder: 1,
        isActive: true,
      });
    }
  }

  // ── Private helpers ─────────────────────────────────

  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.getRandomValues(new Uint8Array(48));
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  }
}
