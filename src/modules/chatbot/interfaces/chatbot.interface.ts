import type { SerializedWidgetSettings, SerializedChatbotSettings, SerializedFormField, SerializedSession } from '../serializers/chatbot.serializer.ts';
import type { PaginationQuery } from '../../../core/validators/pagination.schema.ts';
import type { FormFieldType } from '../enums/chatbot.enum.ts';

export interface IChatbotService {
  // Widget settings
  getOrCreateWidget(): Promise<SerializedWidgetSettings>;
  updateWidget(data: UpdateWidgetSettingsInput): Promise<SerializedWidgetSettings>;

  // Chatbot settings
  getOrCreateChatbot(): Promise<SerializedChatbotSettings>;
  updateChatbot(data: UpdateChatbotSettingsInput): Promise<SerializedChatbotSettings>;

  // Form fields
  listFormFields(): Promise<SerializedFormField[]>;
  createFormField(data: CreateFormFieldInput): Promise<SerializedFormField>;
  updateFormField(id: string, data: UpdateFormFieldInput): Promise<SerializedFormField>;
  deleteFormField(id: string): Promise<void>;
  reorderFormFields(items: ReorderFormFieldItem[]): Promise<SerializedFormField[]>;

  // Sessions
  createSession(formData: Record<string, string>, ipAddress?: string, userAgent?: string, sessionTimeout?: number): Promise<SerializedSession>;
  getSessionByToken(token: string): Promise<SerializedSession>;
  validateSession(token: string): Promise<boolean>;
  refreshSessionExpiry(token: string, timeoutMinutes: number): Promise<void>;

  // Init
  initDefaults(): Promise<void>;
}

export interface UpdateWidgetSettingsInput {
  welcomeMessage?: string;
  iconPath?: string;
  primaryColor?: string;
  fontFamily?: string;
  sessionTimeout?: number;
  isActive?: boolean;
}

export interface UpdateChatbotSettingsInput {
  systemInstruction?: string;
  modelName?: string;
  embeddingModel?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface CreateFormFieldInput {
  fieldName: string;
  label: string;
  fieldType: FormFieldType;
  placeholder?: string;
  options?: Record<string, any>;
  isRequired?: boolean;
  sortOrder?: number;
}

export interface UpdateFormFieldInput {
  fieldName?: string;
  label?: string;
  fieldType?: FormFieldType;
  placeholder?: string;
  options?: Record<string, any>;
  isRequired?: boolean;
  sortOrder?: number;
}

export interface ReorderFormFieldItem {
  id: string;
  sortOrder: number;
}
