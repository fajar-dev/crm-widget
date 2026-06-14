import type { EntryType } from '../enums/knowledge.enum.ts';

export interface CreateCategoryInput {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateKnowledgeBaseInput {
  title: string;
  content: string;
  entryType?: EntryType;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateKnowledgeBaseInput {
  title?: string;
  content?: string;
  entryType?: EntryType;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
  isActive?: boolean;
}

export interface BulkCreateKnowledgeBaseInput {
  items: CreateKnowledgeBaseInput[];
}
