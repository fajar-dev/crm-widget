import type { CreateCategoryInput, UpdateCategoryInput, CreateKnowledgeBaseInput, UpdateKnowledgeBaseInput } from './interfaces/knowledge.interface.ts';
import type { KnowledgeCategoryRepository } from './repositories/knowledge-category.repository.ts';
import type { KnowledgeBaseRepository } from './repositories/knowledge-base.repository.ts';
import { KnowledgeSerializer, type SerializedCategory, type SerializedKnowledgeBase } from './serializers/knowledge.serializer.ts';
import { NotFoundException } from '../../core/exceptions/base.ts';

export interface EmbeddingService {
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export class KnowledgeService {
  constructor(
    private readonly categoryRepo: KnowledgeCategoryRepository,
    private readonly knowledgeBaseRepo: KnowledgeBaseRepository,
    private readonly embeddingService: EmbeddingService | null,
  ) {}

  // ── Categories ─────────────────────────────────────

  async listCategories(): Promise<SerializedCategory[]> {
    const categories = await this.categoryRepo.findAllWithCount();
    return KnowledgeSerializer.categoryCollection(categories);
  }

  async getCategory(id: string): Promise<SerializedCategory & { knowledgeBases: SerializedKnowledgeBase[] }> {
    const category = await this.categoryRepo.findByIdOrFail(id, 'KnowledgeCategory');
    const knowledgeBases = await this.knowledgeBaseRepo.findByCategoryId(id);
    const serialized = KnowledgeSerializer.serializeCategory(category);
    return {
      ...serialized,
      knowledgeBases: KnowledgeSerializer.knowledgeBaseCollection(knowledgeBases),
    };
  }

  async createCategory(data: CreateCategoryInput): Promise<SerializedCategory> {
    const category = await this.categoryRepo.create(data);
    return KnowledgeSerializer.serializeCategory(category);
  }

  async updateCategory(id: string, data: UpdateCategoryInput): Promise<SerializedCategory> {
    const category = await this.categoryRepo.update(id, data, 'KnowledgeCategory');
    return KnowledgeSerializer.serializeCategory(category);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.categoryRepo.findByIdOrFail(id, 'KnowledgeCategory');
    // Delete all knowledge bases in this category first
    const knowledgeBases = await this.knowledgeBaseRepo.findByCategoryId(id);
    for (const kb of knowledgeBases) {
      await this.knowledgeBaseRepo.delete(kb.id, 'KnowledgeBase');
    }
    await this.categoryRepo.delete(id, 'KnowledgeCategory');
  }

  // ── Knowledge Bases ────────────────────────────────

  async listByCategory(categoryId: string): Promise<SerializedKnowledgeBase[]> {
    await this.categoryRepo.findByIdOrFail(categoryId, 'KnowledgeCategory');
    const knowledgeBases = await this.knowledgeBaseRepo.findByCategoryId(categoryId);
    return KnowledgeSerializer.knowledgeBaseCollection(knowledgeBases);
  }

  async getKnowledgeBase(id: string): Promise<SerializedKnowledgeBase> {
    const kb = await this.knowledgeBaseRepo.findByIdOrFail(id, 'KnowledgeBase');
    return KnowledgeSerializer.serializeKnowledgeBase(kb);
  }

  async createKnowledgeBase(categoryId: string, data: CreateKnowledgeBaseInput): Promise<SerializedKnowledgeBase> {
    await this.categoryRepo.findByIdOrFail(categoryId, 'KnowledgeCategory');

    let embedding: number[] | undefined;
    if (this.embeddingService) {
      embedding = await this.embeddingService.embedText(data.title + '\n' + data.content);
    }

    const kb = await this.knowledgeBaseRepo.create({
      ...data,
      categoryId,
      embedding,
    });
    return KnowledgeSerializer.serializeKnowledgeBase(kb);
  }

  async updateKnowledgeBase(id: string, data: UpdateKnowledgeBaseInput): Promise<SerializedKnowledgeBase> {
    const existing = await this.knowledgeBaseRepo.findByIdOrFail(id, 'KnowledgeBase');

    // Re-embed if title or content changed
    let embedding: number[] | undefined;
    if (this.embeddingService && (data.title || data.content)) {
      const title = data.title ?? existing.title;
      const content = data.content ?? existing.content;
      embedding = await this.embeddingService.embedText(title + '\n' + content);
    }

    const updated = await this.knowledgeBaseRepo.update(id, {
      ...data,
      ...(embedding && { embedding }),
    }, 'KnowledgeBase');
    return KnowledgeSerializer.serializeKnowledgeBase(updated);
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    await this.knowledgeBaseRepo.delete(id, 'KnowledgeBase');
  }

  async bulkCreateKnowledgeBases(categoryId: string, items: CreateKnowledgeBaseInput[]): Promise<SerializedKnowledgeBase[]> {
    await this.categoryRepo.findByIdOrFail(categoryId, 'KnowledgeCategory');

    let embeddings: number[][] | undefined;
    if (this.embeddingService) {
      const texts = items.map((item) => item.title + '\n' + item.content);
      embeddings = await this.embeddingService.embedBatch(texts);
    }

    const itemsWithEmbedding = items.map((item, index) => ({
      ...item,
      categoryId,
      ...(embeddings && { embedding: embeddings[index] }),
    }));

    const created = await this.knowledgeBaseRepo.bulkCreate(itemsWithEmbedding);
    return KnowledgeSerializer.knowledgeBaseCollection(created);
  }
}
