import type { KnowledgeBaseRepository } from '../../knowledge/repositories/knowledge-base.repository.ts';
import type { EmbeddingService } from './embedding.service.ts';

export interface RetrievalResult {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  entryType: string;
  distance: number;
}

/**
 * Retrieval service for pgvector similarity search.
 * Embeds the user query and searches the knowledge base for relevant entries.
 */
export class RetrievalService {
  constructor(
    private readonly knowledgeBaseRepo: KnowledgeBaseRepository,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Search the knowledge base using vector similarity.
   * @param query - The user's search query.
   * @param limit - Maximum number of results to return.
   * @returns Ranked retrieval results with distance scores.
   */
  async search(query: string, limit: number = 5): Promise<RetrievalResult[]> {
    const queryEmbedding = await this.embeddingService.embedText(query);
    const results = await this.knowledgeBaseRepo.searchByEmbedding(queryEmbedding, limit);

    return results.map((r: any) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      categoryId: r.category_id ?? r.categoryId,
      entryType: r.entry_type ?? r.entryType,
      distance: r.distance,
    }));
  }
}
