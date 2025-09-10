/**
 * Type definitions for Cerebras AI integration
 */

export interface CerebrasRequest {
  model: string;
  messages: CerebrasMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface CerebrasMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CerebrasResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: CerebrasChoice[];
  usage: CerebrasUsage;
}

export interface CerebrasChoice {
  index: number;
  message: CerebrasMessage;
  finish_reason: string;
}

export interface CerebrasUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface QueryProcessingRequest {
  originalQuery: string;
  context: QueryContext;
  userId: string;
  organizationId: string;
}

export interface QueryProcessingResponse {
  processedQuery: string;
  intent: QueryIntent;
  entities: QueryEntity[];
  confidence: number;
}

export interface QueryContext {
  userHistory: string[];
  organizationData: Record<string, unknown>;
  recentSearches: string[];
  activeIntegrations: string[];
}

export interface QueryIntent {
  type: 'search' | 'filter' | 'action' | 'question';
  category: string;
  confidence: number;
}

export interface QueryEntity {
  type: 'date' | 'person' | 'project' | 'document' | 'status';
  value: string;
  confidence: number;
}

export interface ResultRankingRequest {
  query: string;
  results: AISearchResult[];
  context: QueryContext;
}

export interface ResultRankingResponse {
  rankedResults: RankedSearchResult[];
  rankingExplanation: string;
}

export interface RankedSearchResult extends AISearchResult {
  relevanceScore: number;
  rankingReason: string;
}

export interface AISearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  integrationType: string;
  metadata: Record<string, unknown>;
  url?: string;
  createdAt: string;
}
