import type { DataSource, DeepPartial, FindManyOptions } from 'typeorm';
import { BaseRepository } from '../../../core/repositories/base.repository.ts';
import { KnowledgeBase } from '../entities/knowledge-base.entity.ts';

export interface KnowledgeBaseWithDistance extends KnowledgeBase {
  distance: number;
}

export class KnowledgeBaseRepository extends BaseRepository<KnowledgeBase> {
  constructor(dataSource: DataSource) {
    super(dataSource, KnowledgeBase);
  }

  /**
   * Find all knowledge bases in a category.
   */
  async findByCategoryId(categoryId: string, options?: Omit<FindManyOptions<KnowledgeBase>, 'where'>): Promise<KnowledgeBase[]> {
    return this.repository.find({
      ...options,
      where: { categoryId },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Search knowledge bases by embedding similarity using pgvector cosine distance.
   */
  async searchByEmbedding(embedding: number[], limit: number): Promise<KnowledgeBaseWithDistance[]> {
    const vectorStr = `[${embedding.join(',')}]`;
    const results = await this.repository.query(
      `SELECT *, (embedding <=> $1::vector) as distance
       FROM knowledge_bases
       WHERE is_active = true
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorStr, limit],
    );
    return results as KnowledgeBaseWithDistance[];
  }

  /**
   * Bulk create knowledge bases.
   */
  async bulkCreate(items: DeepPartial<KnowledgeBase>[]): Promise<KnowledgeBase[]> {
    const entities = this.repository.create(items);
    return this.repository.save(entities);
  }
}
