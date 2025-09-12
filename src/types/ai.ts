/**
 * AI-related type definitions for Sphyr
 * Provides type safety for AI operations and data structures
 */

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultsCount: number;
  userId: string;
  organizationId?: string;
}

export interface IntegrationStatus {
  provider: string;
  connected: boolean;
  connectedAt?: string;
  lastSync?: string;
  permissions?: string[];
  scopes?: string[];
}

export interface OrganizationData {
  id: string;
  name: string;
  settings: Record<string, unknown>;
  integrations: IntegrationStatus[];
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    dataSharing?: boolean;
  };
}

export interface QueryContext {
  recentSearches: SearchHistoryItem[];
  userHistory: SearchHistoryItem[];
  activeIntegrations: IntegrationStatus[];
  organizationData: OrganizationData;
}

export interface QueryProcessingRequest {
  originalQuery: string;
  userId: string;
  organizationId: string;
  context: QueryContext;
}

export interface QueryProcessingResponse {
  intent: {
    type: 'search' | 'filter' | 'navigate' | 'action';
    category: string;
    confidence: number;
  };
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
    position: { start: number; end: number };
  }>;
  processedQuery: string;
  confidence: number;
  suggestions?: string[];
}

export interface AISearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  integrationType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  url?: string;
}

export interface RankedSearchResult extends AISearchResult {
  relevanceScore: number;
  rankingReason: string;
}

export interface ResultRankingRequest {
  query: string;
  results: AISearchResult[];
  context: QueryContext;
}

export interface ResultRankingResponse {
  rankedResults: Array<{
    id: string;
    relevanceScore: number;
    rankingReason: string;
  }>;
  rankingExplanation: string;
}

export interface CerebrasRequest {
  query?: string;
  model?: string;
  messages?: Array<{
    role: string;
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  context?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export interface CerebrasResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  created?: number;
}