import { LlmAgent, InMemoryRunner, FunctionTool, Gemini, isFinalResponse, stringifyContent } from '@google/adk';
import type { Schema } from '@google/genai';
import type { RetrievalService, RetrievalResult } from './retrieval.service.ts';
import { config } from '../../../config/config.ts';

export interface AgentResponse {
  reply: string;
  sources: RetrievalResult[];
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}

/**
 * Core ADK agent service that powers the agentic RAG chatbot.
 *
 * Uses Google ADK's LlmAgent with a FunctionTool for knowledge search.
 * The agent autonomously decides when to search the knowledge base
 * based on the user's query and conversation context.
 */
export class AgentService {
  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly modelName: string,
    private readonly apiKey: string,
  ) {}

  /**
   * Process a user message through the ADK agent with RAG capabilities.
   *
   * @param message - The user's message.
   * @param history - Previous conversation history.
   * @param systemInstruction - System instruction from chatbot settings.
   * @param agentConfig - Model configuration parameters.
   * @returns Agent response with reply text, sources, and token usage.
   */
  async chat(
    message: string,
    history: Array<{ role: string; content: string }>,
    systemInstruction: string,
    agentConfig: { temperature: number; maxTokens: number; topP: number; topK: number },
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const collectedSources: RetrievalResult[] = [];

    // Parameter schema using @google/genai Schema format
    const searchParams: Schema = {
      type: 'OBJECT' as any,
      properties: {
        query: {
          type: 'STRING' as any,
          description: 'The search query to find relevant knowledge base entries',
        },
        limit: {
          type: 'NUMBER' as any,
          description: 'Maximum number of results to return (default: 5)',
        },
      },
      required: ['query'],
    };

    // Create the knowledge search tool
    const searchKnowledgeTool = new FunctionTool({
      name: 'searchKnowledge',
      description:
        'Search the knowledge base for relevant information to answer the user\'s question. ' +
        'Use this tool when you need factual information, product details, company policies, ' +
        'or any domain-specific knowledge to provide an accurate answer.',
      parameters: searchParams,
      execute: async (rawArgs: unknown) => {
        const args = rawArgs as { query: string; limit?: number };
        const results = await this.retrievalService.search(args.query, args.limit ?? 5);
        collectedSources.push(...results);

        if (results.length === 0) {
          return { results: [], message: 'No relevant knowledge base entries found.' };
        }

        return {
          results: results.map((r) => ({
            title: r.title,
            content: r.content,
            entryType: r.entryType,
            relevanceScore: 1 - r.distance,
          })),
        };
      },
    });


    // Build the system instruction with conversation context
    const fullInstruction = this.buildInstruction(systemInstruction, history);

    // Create the ADK agent with explicit Gemini instance
    const agent = new LlmAgent({
      name: 'chatbot',
      model: new Gemini({ model: this.modelName, apiKey: this.apiKey }),
      instruction: fullInstruction,
      tools: [searchKnowledgeTool],
      generateContentConfig: {
        temperature: agentConfig.temperature,
        maxOutputTokens: agentConfig.maxTokens,
        topP: agentConfig.topP,
        topK: agentConfig.topK,
      },
    });

    // Create a runner
    const runner = new InMemoryRunner({
      agent,
      appName: 'crm-chatbot',
    });

    // Run the agent
    let replyText = '';
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    try {
      const events = runner.runEphemeral({
        userId: 'chat-user',
        newMessage: {
          role: 'user',
          parts: [{ text: message }],
        },
      });

      for await (const event of events) {
        // Collect usage metadata
        if (event.usageMetadata) {
          promptTokens += event.usageMetadata.promptTokenCount ?? 0;
          completionTokens += event.usageMetadata.candidatesTokenCount ?? 0;
          totalTokens += event.usageMetadata.totalTokenCount ?? 0;
        }

        // Collect final response text
        if (isFinalResponse(event)) {
          const text = stringifyContent(event);
          if (text) {
            replyText += text;
          }
        }
      }
    } catch (error) {
      console.error('[AgentService] ADK agent error:', error);
      throw new Error(`Agent processing failed: ${(error as Error).message}`);
    }

    const latencyMs = Date.now() - startTime;

    // Deduplicate sources by id
    const uniqueSources = this.deduplicateSources(collectedSources);

    return {
      reply: replyText || 'I apologize, but I was unable to generate a response. Please try again.',
      sources: uniqueSources,
      promptTokens,
      completionTokens,
      totalTokens,
      latencyMs,
    };
  }

  /**
   * Build a full instruction string including conversation history context.
   */
  private buildInstruction(
    systemInstruction: string,
    history: Array<{ role: string; content: string }>,
  ): string {
    let instruction = systemInstruction;

    if (history.length > 0) {
      instruction += '\n\n--- Conversation History ---\n';
      for (const msg of history) {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        instruction += `${role}: ${msg.content}\n`;
      }
      instruction += '--- End of History ---\n';
      instruction += '\nPlease continue the conversation based on the above history.';
    }

    return instruction;
  }

  /**
   * Deduplicate sources by their ID, keeping the first occurrence (lowest distance).
   */
  private deduplicateSources(sources: RetrievalResult[]): RetrievalResult[] {
    const seen = new Set<string>();
    return sources.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }
}
