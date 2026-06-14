import type { KnowledgeCategory } from '../entities/knowledge-category.entity.ts';
import type { KnowledgeBase } from '../entities/knowledge-base.entity.ts';
import type { EntryType } from '../enums/knowledge.enum.ts';

export interface SerializedCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  knowledgeBaseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedKnowledgeBase {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  entryType: string;
  metadata: Record<string, unknown> | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class KnowledgeSerializer {
  static serializeCategory(entity: KnowledgeCategory & { knowledgeBaseCount?: number }): SerializedCategory {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description ?? null,
      sortOrder: entity.sortOrder,
      isActive: entity.isActive,
      ...(entity.knowledgeBaseCount !== undefined && { knowledgeBaseCount: entity.knowledgeBaseCount }),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static categoryCollection(entities: (KnowledgeCategory & { knowledgeBaseCount?: number })[]): SerializedCategory[] {
    return entities.map(KnowledgeSerializer.serializeCategory);
  }

  static serializeKnowledgeBase(entity: KnowledgeBase): SerializedKnowledgeBase {
    return {
      id: entity.id,
      categoryId: entity.categoryId,
      title: entity.title,
      content: entity.content,
      entryType: entity.entryType,
      metadata: entity.metadata ?? null,
      sortOrder: entity.sortOrder,
      isActive: entity.isActive,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static knowledgeBaseCollection(entities: KnowledgeBase[]): SerializedKnowledgeBase[] {
    return entities.map(KnowledgeSerializer.serializeKnowledgeBase);
  }
}
