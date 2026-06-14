import type { WidgetSettings } from '../entities/widget-settings.entity.ts';
import type { ChatbotSettings } from '../entities/chatbot-settings.entity.ts';
import type { ChatbotFormField } from '../entities/chatbot-form-field.entity.ts';
import type { ChatbotSession } from '../entities/chatbot-session.entity.ts';
import type { FormFieldType } from '../enums/chatbot.enum.ts';

export interface SerializedWidgetSettings {
  id: string;
  welcomeMessage: string;
  iconPath: string | null;
  primaryColor: string;
  fontFamily: string;
  sessionTimeout: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedChatbotSettings {
  id: string;
  systemInstruction: string;
  modelName: string;
  embeddingModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedFormField {
  id: string;
  fieldName: string;
  label: string;
  fieldType: FormFieldType;
  placeholder: string | null;
  options: Record<string, any> | null;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedSession {
  id: string;
  sessionToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  lastActivityAt: string;
  values: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export class ChatbotSerializer {
  static serializeWidgetSettings(settings: WidgetSettings): SerializedWidgetSettings {
    return {
      id: settings.id,
      welcomeMessage: settings.welcomeMessage,
      iconPath: settings.iconPath ?? null,
      primaryColor: settings.primaryColor,
      fontFamily: settings.fontFamily,
      sessionTimeout: settings.sessionTimeout,
      isActive: settings.isActive,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  static serializeChatbotSettings(settings: ChatbotSettings): SerializedChatbotSettings {
    return {
      id: settings.id,
      systemInstruction: settings.systemInstruction,
      modelName: settings.modelName,
      embeddingModel: settings.embeddingModel,
      temperature: Number(settings.temperature),
      maxTokens: settings.maxTokens,
      topP: Number(settings.topP),
      topK: settings.topK,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  static serializeFormField(field: ChatbotFormField): SerializedFormField {
    return {
      id: field.id,
      fieldName: field.fieldName,
      label: field.label,
      fieldType: field.fieldType,
      placeholder: field.placeholder ?? null,
      options: field.options ?? null,
      isRequired: field.isRequired,
      sortOrder: field.sortOrder,
      isActive: field.isActive,
      createdAt: field.createdAt.toISOString(),
      updatedAt: field.updatedAt.toISOString(),
    };
  }

  static formFieldCollection(fields: ChatbotFormField[]): SerializedFormField[] {
    return fields.map(ChatbotSerializer.serializeFormField);
  }

  static serializeSession(session: ChatbotSession): SerializedSession {
    const values: Record<string, string> = {};
    if (session.values) {
      for (const sv of session.values) {
        values[sv.fieldName] = sv.fieldValue;
      }
    }

    return {
      id: session.id,
      sessionToken: session.sessionToken,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      expiresAt: session.expiresAt.toISOString(),
      lastActivityAt: session.lastActivityAt.toISOString(),
      values,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  static sessionCollection(sessions: ChatbotSession[]): SerializedSession[] {
    return sessions.map(ChatbotSerializer.serializeSession);
  }
}
