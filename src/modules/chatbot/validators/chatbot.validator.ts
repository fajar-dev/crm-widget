import { z } from 'zod';
import { FormFieldType } from '../enums/chatbot.enum.ts';

export const updateWidgetSettingsSchema = z.object({
  welcomeMessage: z.string().min(1).optional(),
  iconPath: z.string().max(500).optional(),
  primaryColor: z.string().max(20).optional(),
  fontFamily: z.string().max(100).optional(),
  sessionTimeout: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const updateChatbotSettingsSchema = z.object({
  systemInstruction: z.string().min(1).optional(),
  modelName: z.string().max(100).optional(),
  embeddingModel: z.string().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().int().min(1).optional(),
});

export const createFormFieldSchema = z.object({
  fieldName: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  fieldType: z.nativeEnum(FormFieldType),
  placeholder: z.string().max(200).optional(),
  options: z.record(z.any()).optional(),
  isRequired: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const updateFormFieldSchema = z.object({
  fieldName: z.string().min(1).max(100).optional(),
  label: z.string().min(1).max(200).optional(),
  fieldType: z.nativeEnum(FormFieldType).optional(),
  placeholder: z.string().max(200).optional(),
  options: z.record(z.any()).optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const reorderFormFieldsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    }),
  ).min(1),
});

export const createSessionSchema = z.record(z.string(), z.string());

export type UpdateWidgetSettingsInput = z.infer<typeof updateWidgetSettingsSchema>;
export type UpdateChatbotSettingsInput = z.infer<typeof updateChatbotSettingsSchema>;
export type CreateFormFieldInput = z.infer<typeof createFormFieldSchema>;
export type UpdateFormFieldInput = z.infer<typeof updateFormFieldSchema>;
export type ReorderFormFieldsInput = z.infer<typeof reorderFormFieldsSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
