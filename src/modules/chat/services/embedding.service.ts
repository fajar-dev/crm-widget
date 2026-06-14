import { GoogleGenAI } from '@google/genai';
import { config } from '../../../config/config.ts';

/**
 * Service for generating text embeddings using Gemini API.
 * Used by KnowledgeService (auto-embed on create/update)
 * and RetrievalService (embed user query for search).
 */
export class EmbeddingService {
  private readonly client: GoogleGenAI;
  private readonly modelName: string;

  constructor(modelName?: string) {
    this.client = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
    this.modelName = modelName ?? config.GEMINI_EMBEDDING_MODEL;
  }

  /**
   * Embed a single text string.
   * Returns a 768-dimension vector (for text-embedding-004).
   */
  async embedText(text: string): Promise<number[]> {
    const response = await this.client.models.embedContent({
      model: this.modelName,
      contents: text,
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) {
      throw new Error('Failed to generate embedding: no values returned');
    }

    return embedding;
  }

  /**
   * Embed multiple texts in a single batch request.
   * Returns array of vectors in the same order as input.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];

    // Gemini batch embedding — process in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);
      const promises = chunk.map((text) => this.embedText(text));
      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    return results;
  }
}
