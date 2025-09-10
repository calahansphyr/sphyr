/**
 * Cerebras AI client wrapper
 * Handles all communication with the Cerebras API
 */

import { aiConfig } from '../../config/ai';
import type { 
  CerebrasRequest, 
  CerebrasResponse, 
  QueryProcessingRequest, 
  QueryProcessingResponse,
  ResultRankingRequest,
  ResultRankingResponse 
} from '../../types/ai';

export class CerebrasClient {
  private apiKey: string;
  private apiUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.apiKey = aiConfig.cerebras.apiKey;
    this.apiUrl = aiConfig.cerebras.apiUrl;
    this.timeout = aiConfig.cerebras.timeout;
    this.retryAttempts = aiConfig.cerebras.retryAttempts;
    this.retryDelay = aiConfig.cerebras.retryDelay;
  }

  /**
   * Process a user query to understand intent and extract entities
   */
  async processQuery(request: QueryProcessingRequest): Promise<QueryProcessingResponse> {
    const prompt = this.buildQueryProcessingPrompt(request);
    
    const cerebrasRequest: CerebrasRequest = {
      model: aiConfig.cerebras.model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that processes search queries to understand user intent and extract relevant entities.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: aiConfig.cerebras.maxTokens,
      temperature: aiConfig.cerebras.temperature
    };

    const response = await this.makeRequest(cerebrasRequest);
    return this.parseQueryProcessingResponse(response);
  }

  /**
   * Rank search results based on relevance to the query
   */
  async rankResults(request: ResultRankingRequest): Promise<ResultRankingResponse> {
    const prompt = this.buildResultRankingPrompt(request);
    
    const cerebrasRequest: CerebrasRequest = {
      model: aiConfig.cerebras.model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that ranks search results based on their relevance to a user query.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: aiConfig.cerebras.maxTokens,
      temperature: aiConfig.cerebras.temperature
    };

    const response = await this.makeRequest(cerebrasRequest);
    return this.parseResultRankingResponse(response);
  }

  /**
   * Make a request to the Cerebras API with retry logic
   */
  private async makeRequest(request: CerebrasRequest): Promise<CerebrasResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.apiUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Cerebras API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data as CerebrasResponse;

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Cerebras API request failed after ${this.retryAttempts} attempts: ${lastError?.message}`);
  }

  /**
   * Build prompt for query processing
   */
  private buildQueryProcessingPrompt(request: QueryProcessingRequest): string {
    return `
Analyze the following search query and provide structured information about the user's intent and extracted entities.

Query: "${request.originalQuery}"

Context:
- User has searched for: ${request.context.recentSearches.join(', ')}
- Active integrations: ${request.context.activeIntegrations.join(', ')}
- Organization data: ${JSON.stringify(request.context.organizationData)}

Please respond with a JSON object containing:
1. processedQuery: A cleaned and optimized version of the query
2. intent: { type: "search"|"filter"|"action"|"question", category: string, confidence: number }
3. entities: Array of { type: "date"|"person"|"project"|"document"|"status", value: string, confidence: number }
4. confidence: Overall confidence score (0-1)

Focus on understanding what the user is looking for and extracting key information that can help with search.
    `.trim();
  }

  /**
   * Build prompt for result ranking
   */
  private buildResultRankingPrompt(request: ResultRankingRequest): string {
    const resultsText = request.results.map((result, index) => 
      `${index + 1}. ${result.title}\n   Source: ${result.source}\n   Content: ${result.content.substring(0, 200)}...`
    ).join('\n\n');

    return `
Rank the following search results based on their relevance to the query: "${request.query}"

Results:
${resultsText}

Please respond with a JSON object containing:
1. rankedResults: Array of results with added relevanceScore (0-1) and rankingReason
2. rankingExplanation: Brief explanation of the ranking logic

Consider factors like:
- Direct relevance to the query terms
- Recency of the content
- Source credibility
- Content quality and completeness
    `.trim();
  }

  /**
   * Parse query processing response from Cerebras
   */
  private parseQueryProcessingResponse(response: CerebrasResponse): QueryProcessingResponse {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in Cerebras response');
      }

      const parsed = JSON.parse(content);
      return {
        processedQuery: parsed.processedQuery || '',
        intent: parsed.intent || { type: 'search', category: 'general', confidence: 0.5 },
        entities: parsed.entities || [],
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      console.error('Error parsing query processing response:', error);
      return {
        processedQuery: '',
        intent: { type: 'search', category: 'general', confidence: 0.5 },
        entities: [],
        confidence: 0.5
      };
    }
  }

  /**
   * Parse result ranking response from Cerebras
   */
  private parseResultRankingResponse(response: CerebrasResponse): ResultRankingResponse {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in Cerebras response');
      }

      const parsed = JSON.parse(content);
      return {
        rankedResults: parsed.rankedResults || [],
        rankingExplanation: parsed.rankingExplanation || 'Results ranked by relevance'
      };
    } catch (error) {
      console.error('Error parsing result ranking response:', error);
      return {
        rankedResults: [],
        rankingExplanation: 'Error in ranking - using original order'
      };
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
