import type { RetrievalResult } from '../services/retrieval.service.ts';

/**
 * Public-facing widget configuration returned to the chat widget.
 */
export interface PublicChatConfig {
  tenantName: string;
  welcomeMessage: string;
  primaryColor: string;
  fontFamily: string;
  iconPath: string | null;
  isActive: boolean;
  formFields: PublicFormField[];
}

export interface PublicFormField {
  fieldName: string;
  label: string;
  fieldType: string;
  placeholder: string | null;
  options: Record<string, any> | null;
  isRequired: boolean;
  sortOrder: number;
}

/**
 * Input for sending a chat message.
 */
export interface SendMessageInput {
  message: string;
}

/**
 * Response returned after sending a chat message.
 */
export interface ChatResponse {
  reply: string;
  sources: RetrievalResult[];
  conversationId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}

/**
 * Input for the playground (authenticated) chat endpoint.
 */
export interface PlaygroundInput {
  message: string;
  history?: Array<{ role: string; content: string }>;
}
