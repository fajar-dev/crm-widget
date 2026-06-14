import { z } from 'zod';
import { EntryType } from '../enums/knowledge.enum.ts';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createKnowledgeBaseSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  entryType: z.nativeEnum(EntryType).optional().default(EntryType.FAQ),
  metadata: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateKnowledgeBaseSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  entryType: z.nativeEnum(EntryType).optional(),
  metadata: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const bulkCreateKnowledgeBaseSchema = z.object({
  items: z.array(createKnowledgeBaseSchema).min(1),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateKnowledgeBaseInput = z.infer<typeof createKnowledgeBaseSchema>;
export type UpdateKnowledgeBaseInput = z.infer<typeof updateKnowledgeBaseSchema>;
export type BulkCreateKnowledgeBaseInput = z.infer<typeof bulkCreateKnowledgeBaseSchema>;
