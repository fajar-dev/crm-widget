import type { DataSource } from 'typeorm';
import { BaseRepository } from '../../../core/repositories/base.repository.ts';
import { KnowledgeCategory } from '../entities/knowledge-category.entity.ts';

export class KnowledgeCategoryRepository extends BaseRepository<KnowledgeCategory> {
  constructor(dataSource: DataSource) {
    super(dataSource, KnowledgeCategory);
  }

  /**
   * Find all categories with knowledge base count.
   */
  async findAllWithCount(): Promise<(KnowledgeCategory & { knowledgeBaseCount: number })[]> {
    const results = await this.repository
      .createQueryBuilder('category')
      .loadRelationCountAndMap('category.knowledgeBaseCount', 'category.knowledgeBases')
      .orderBy('category.sort_order', 'ASC')
      .getMany();

    return results as (KnowledgeCategory & { knowledgeBaseCount: number })[];
  }

  /**
   * Find all active categories, ordered by sort_order ascending.
   */
  async findAllActive(): Promise<KnowledgeCategory[]> {
    return this.repository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }
}
