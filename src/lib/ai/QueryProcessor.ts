import { CerebrasClient } from '@/lib/ai/cerebras-client';
import { logger } from '@/lib/logger';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';
import { executeWithAIFallback } from '@/lib/ai/ai-fallback-manager';
import { SearchHistoryItem, IntegrationStatus, OrganizationData } from '@/types/ai';

export interface QueryIntent {
  type: 'search' | 'question' | 'command' | 'comparison' | 'analysis' | 'creation' | 'update' | 'delete';
  confidence: number;
  entities: QueryEntity[];
  parameters: QueryParameters;
  context: QueryContext;
}

export interface QueryEntity {
  type: 'person' | 'organization' | 'date' | 'location' | 'product' | 'project' | 'document' | 'topic' | 'metric';
  value: string;
  confidence: number;
  position: { start: number; end: number };
  metadata?: Record<string, unknown>;
}

export interface QueryParameters {
  timeRange?: {
    start: Date;
    end: Date;
    type: 'absolute' | 'relative';
  };
  filters?: Record<string, unknown>;
  sortBy?: string;
  limit?: number;
  includeDeleted?: boolean;
  scope?: 'personal' | 'team' | 'organization' | 'public';
}

export interface QueryContext {
  domain: 'business' | 'technical' | 'legal' | 'financial' | 'general';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  complexity: 'simple' | 'moderate' | 'complex';
  expectedResultType: 'document' | 'data' | 'analysis' | 'action' | 'mixed';
}

export interface ProcessedQuery {
  originalQuery: string;
  intent: QueryIntent;
  processedQuery: string;
  searchTerms: string[];
  filters: Record<string, unknown>;
  suggestions: string[];
  confidence: number;
  processingTime: number;
  createdAt: Date;
}

export interface QueryProcessingOptions {
  includeSuggestions: boolean;
  maxSuggestions: number;
  includeFilters: boolean;
  includeEntities: boolean;
  includeIntent: boolean;
  language: string;
  domain: string;
  userId?: string;
  organizationId?: string;
  recentSearches?: SearchHistoryItem[];
  activeIntegrations?: IntegrationStatus[];
  organizationData?: OrganizationData;
}

class QueryProcessor {
  private static instance: QueryProcessor;
  private readonly STORAGE_KEY = 'sphyr-processed-queries';
  private readonly MAX_QUERIES = 1000;

  public static getInstance(): QueryProcessor {
    if (!QueryProcessor.instance) {
      QueryProcessor.instance = new QueryProcessor();
    }
    return QueryProcessor.instance;
  }

  // Main query processing method
  public async processQuery(
    query: string,
    options: QueryProcessingOptions
  ): Promise<ProcessedQuery> {
    const startTime = Date.now();
    
    try {
      // Check for cached processing result
      const cached = this.getCachedProcessing(query, options);
      if (cached) {
        return cached;
      }

      // Process the query
      const intent = await this.analyzeIntent(query, options);
      const processedQuery = this.cleanAndNormalizeQuery(query);
      const searchTerms = this.extractSearchTerms(processedQuery);
      const filters = this.extractFilters(query, options);
      const suggestions = options.includeSuggestions 
        ? await this.generateSuggestions(query, intent, options)
        : [];
      
      const confidence = this.calculateOverallConfidence(intent, searchTerms, filters);
      
      const result: ProcessedQuery = {
        originalQuery: query,
        intent,
        processedQuery,
        searchTerms,
        filters,
        suggestions,
        confidence,
        processingTime: Date.now() - startTime,
        createdAt: new Date()
      };
      
      // Cache the result
      this.cacheProcessing(query, options, result);
      
      return result;
    } catch (error) {
      logger.error('Query processing failed', error as Error, {
        operation: 'processQuery',
        query: query
      });
      throw new Error(`Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Analyze query intent using AI with fallback
  private async analyzeIntent(query: string, options: QueryProcessingOptions): Promise<QueryIntent> {
    return executeWithAIFallback(
      // AI operation
      async () => {
        const cerebrasClient = new CerebrasClient();
        const response = await cerebrasClient.processQuery({
          originalQuery: query,
          userId: options.userId || 'anonymous',
          organizationId: options.organizationId || 'default',
          context: {
            recentSearches: options.recentSearches || [],
            activeIntegrations: options.activeIntegrations || [],
            organizationData: options.organizationData || {
              id: 'default',
              name: 'Default Organization',
              settings: {},
              integrations: []
            },
            userHistory: options.recentSearches || []
          }
        });
        
        // Convert AI response to our format
        return {
          type: response.intent.type as QueryIntent['type'],
          confidence: response.intent.confidence,
          entities: response.entities.map(entity => ({
            type: entity.type as QueryEntity['type'],
            value: entity.value,
            confidence: entity.confidence,
            position: entity.position || { start: 0, end: entity.value.length }
          })),
          parameters: this.extractParameters(query, options),
          context: this.determineContext(query, options)
        };
      },
      // Fallback operation
      () => this.fallbackIntentAnalysis(query, options),
      // Operation name for logging
      'query intent analysis'
    );
  }

  // Fallback intent analysis using rule-based logic
  private fallbackIntentAnalysis(query: string, options: QueryProcessingOptions): QueryIntent {
    const queryLower = query.toLowerCase();
    
    // Determine intent type
    const intentType = this.determineIntentType(queryLower);
    
    // Extract entities
    const entities = options.includeEntities ? this.extractEntities(query) : [];
    
    // Extract parameters
    const parameters = this.extractParameters(query, options);
    
    // Determine context
    const context = this.determineContext(query, options);
    
    // Calculate confidence (lower for fallback)
    const confidence = Math.max(0.3, this.calculateIntentConfidence(query, intentType, entities) * 0.7);
    
    return {
      type: intentType,
      confidence,
      entities,
      parameters,
      context
    };
  }

  // Determine intent type
  private determineIntentType(query: string): QueryIntent['type'] {
    // Question patterns
    if (/\b(what|how|when|where|why|who|which|can|could|would|should|is|are|was|were|do|does|did)\b/i.test(query)) {
      return 'question';
    }
    
    // Command patterns
    if (/\b(show|find|get|list|display|create|make|build|generate|delete|remove|update|edit|modify)\b/i.test(query)) {
      return 'command';
    }
    
    // Comparison patterns
    if (/\b(compare|versus|vs|difference|between|versus|against)\b/i.test(query)) {
      return 'comparison';
    }
    
    // Analysis patterns
    if (/\b(analyze|analysis|trend|pattern|insight|summary|report|statistics|metrics)\b/i.test(query)) {
      return 'analysis';
    }
    
    // Creation patterns
    if (/\b(create|make|build|generate|new|add|insert)\b/i.test(query)) {
      return 'creation';
    }
    
    // Update patterns
    if (/\b(update|edit|modify|change|revise|amend)\b/i.test(query)) {
      return 'update';
    }
    
    // Delete patterns
    if (/\b(delete|remove|eliminate|cancel|archive)\b/i.test(query)) {
      return 'delete';
    }
    
    // Default to search
    return 'search';
  }

  // Extract entities from query
  private extractEntities(query: string): QueryEntity[] {
    const entities: QueryEntity[] = [];
    
    // Extract dates
    const datePatterns = [
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b(?:yesterday|today|tomorrow|last week|next week|last month|next month|last year|next year)\b/gi
    ];
    
    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        entities.push({
          type: 'date',
          value: match[0],
          confidence: 0.9,
          position: { start: match.index, end: match.index + match[0].length },
          metadata: { normalizedDate: this.normalizeDate(match[0]) }
        });
      }
    });
    
    // Extract monetary values
    const moneyPattern = /\$[\d,]+(?:\.\d{2})?/g;
    let match;
    while ((match = moneyPattern.exec(query)) !== null) {
      entities.push({
        type: 'metric',
        value: match[0],
        confidence: 0.9,
        position: { start: match.index, end: match.index + match[0].length },
        metadata: { type: 'monetary' }
      });
    }
    
    // Extract percentages
    const percentagePattern = /\b(\d+(?:\.\d+)?)\s*%/g;
    while ((match = percentagePattern.exec(query)) !== null) {
      entities.push({
        type: 'metric',
        value: match[0],
        confidence: 0.9,
        position: { start: match.index, end: match.index + match[0].length },
        metadata: { type: 'percentage' }
      });
    }
    
    // Extract project names (capitalized words)
    const projectPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    while ((match = projectPattern.exec(query)) !== null) {
      const value = match[0];
      if (value.length > 3 && !this.isCommonWord(value)) {
        entities.push({
          type: 'project',
          value,
          confidence: 0.7,
          position: { start: match.index, end: match.index + value.length }
        });
      }
    }
    
    // Extract document types
    const documentTypes = ['report', 'document', 'file', 'spreadsheet', 'presentation', 'email', 'meeting', 'note'];
    documentTypes.forEach(type => {
      const pattern = new RegExp(`\\b${type}\\b`, 'gi');
      while ((match = pattern.exec(query)) !== null) {
        entities.push({
          type: 'document',
          value: match[0],
          confidence: 0.8,
          position: { start: match.index, end: match.index + match[0].length }
        });
      }
    });
    
    return entities;
  }

  // Extract parameters from query
  private extractParameters(query: string, options: QueryProcessingOptions): QueryParameters {
    const parameters: QueryParameters = {};
    
    // Extract time range
    const timeRange = this.extractTimeRange(query);
    if (timeRange) {
      parameters.timeRange = timeRange;
    }
    
    // Extract filters
    if (options.includeFilters) {
      parameters.filters = this.extractFilters(query, options);
    }
    
    // Extract sort preferences
    const sortBy = this.extractSortPreference(query);
    if (sortBy) {
      parameters.sortBy = sortBy;
    }
    
    // Extract limit
    const limit = this.extractLimit(query);
    if (limit) {
      parameters.limit = limit;
    }
    
    // Extract scope
    const scope = this.extractScope(query);
    if (scope) {
      parameters.scope = scope;
    }
    
    return parameters;
  }

  // Determine query context
  private determineContext(query: string, options: QueryProcessingOptions): QueryContext {
    const queryLower = query.toLowerCase();
    
    // Determine domain
    const domain = this.determineDomain(queryLower, options.domain);
    
    // Determine urgency
    const urgency = this.determineUrgency(queryLower);
    
    // Determine complexity
    const complexity = this.determineComplexity(query);
    
    // Determine expected result type
    const expectedResultType = this.determineExpectedResultType(queryLower);
    
    return {
      domain,
      urgency,
      complexity,
      expectedResultType
    };
  }

  // Clean and normalize query
  private cleanAndNormalizeQuery(query: string): string {
    // Remove extra whitespace
    const cleaned = query.replace(/\s+/g, ' ').trim();
    
    // Remove common stop words for search terms
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = cleaned.split(' ');
    const filteredWords = words.filter(word => !stopWords.includes(word.toLowerCase()));
    
    return filteredWords.join(' ');
  }

  // Extract search terms
  private extractSearchTerms(query: string): string[] {
    const words = query.split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    return words
      .filter(word => word.length > 2 && !stopWords.includes(word.toLowerCase()))
      .map(word => word.toLowerCase());
  }

  // Extract filters from query
  private extractFilters(query: string, _options: QueryProcessingOptions): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    const queryLower = query.toLowerCase();
    
    // File type filters
    const fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'html'];
    fileTypes.forEach(type => {
      if (queryLower.includes(type)) {
        filters.fileType = type;
      }
    });
    
    // Source filters
    const sources = ['google', 'notion', 'slack', 'github', 'confluence', 'jira', 'asana', 'trello'];
    sources.forEach(source => {
      if (queryLower.includes(source)) {
        filters.source = source;
      }
    });
    
    // Author filters
    const authorPattern = /(?:by|from)\s+([a-zA-Z\s]+)/i;
    const authorMatch = query.match(authorPattern);
    if (authorMatch) {
      filters.author = authorMatch[1].trim();
    }
    
    // Date filters
    const dateRange = this.extractTimeRange(query);
    if (dateRange) {
      filters.dateRange = dateRange;
    }
    
    return filters;
  }

  // Generate suggestions
  private async generateSuggestions(
    query: string,
    intent: QueryIntent,
    options: QueryProcessingOptions
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Intent-based suggestions
    switch (intent.type) {
      case 'question':
        suggestions.push(...this.generateQuestionSuggestions(query));
        break;
      case 'command':
        suggestions.push(...this.generateCommandSuggestions(query));
        break;
      case 'analysis':
        suggestions.push(...this.generateAnalysisSuggestions(query));
        break;
      default:
        suggestions.push(...this.generateGeneralSuggestions(query));
    }
    
    // Entity-based suggestions
    if (intent.entities.length > 0) {
      suggestions.push(...this.generateEntitySuggestions(intent.entities));
    }
    
    // Domain-based suggestions
    suggestions.push(...this.generateDomainSuggestions(intent.context.domain));
    
    return suggestions.slice(0, options.maxSuggestions);
  }

  // Helper methods for parameter extraction
  private extractTimeRange(query: string): QueryParameters['timeRange'] | null {
    const queryLower = query.toLowerCase();
    
    // Relative time ranges
    if (queryLower.includes('last week')) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { start, end, type: 'relative' };
    }
    
    if (queryLower.includes('last month')) {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      return { start, end, type: 'relative' };
    }
    
    if (queryLower.includes('last year')) {
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      return { start, end, type: 'relative' };
    }
    
    // Absolute date ranges
    const datePattern = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi;
    const dates = query.match(datePattern);
    if (dates && dates.length >= 2) {
      return {
        start: new Date(dates[0]),
        end: new Date(dates[1]),
        type: 'absolute'
      };
    }
    
    return null;
  }

  private extractSortPreference(query: string): string | null {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('newest') || queryLower.includes('recent')) return 'date_desc';
    if (queryLower.includes('oldest')) return 'date_asc';
    if (queryLower.includes('alphabetical') || queryLower.includes('a-z')) return 'title_asc';
    if (queryLower.includes('z-a')) return 'title_desc';
    if (queryLower.includes('relevance')) return 'relevance';
    
    return null;
  }

  private extractLimit(query: string): number | null {
    const limitPattern = /(?:show|display|list)\s+(\d+)/i;
    const match = query.match(limitPattern);
    return match ? parseInt(match[1]) : null;
  }

  private extractScope(query: string): QueryParameters['scope'] | null {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('my') || queryLower.includes('personal')) return 'personal';
    if (queryLower.includes('team')) return 'team';
    if (queryLower.includes('organization') || queryLower.includes('company')) return 'organization';
    if (queryLower.includes('public')) return 'public';
    
    return null;
  }

  // Helper methods for context determination
  private determineDomain(query: string, defaultDomain: string): QueryContext['domain'] {
    if (query.includes('budget') || query.includes('financial') || query.includes('cost')) return 'financial';
    if (query.includes('legal') || query.includes('contract') || query.includes('compliance')) return 'legal';
    if (query.includes('technical') || query.includes('api') || query.includes('code')) return 'technical';
    if (query.includes('business') || query.includes('strategy') || query.includes('management')) return 'business';
    
    return defaultDomain as QueryContext['domain'] || 'general';
  }

  private determineUrgency(query: string): QueryContext['urgency'] {
    if (query.includes('urgent') || query.includes('asap') || query.includes('immediately')) return 'urgent';
    if (query.includes('important') || query.includes('priority') || query.includes('critical')) return 'high';
    if (query.includes('soon') || query.includes('quickly')) return 'medium';
    
    return 'low';
  }

  private determineComplexity(query: string): QueryContext['complexity'] {
    const words = query.split(/\s+/);
    if (words.length > 10) return 'complex';
    if (words.length > 5) return 'moderate';
    
    return 'simple';
  }

  private determineExpectedResultType(query: string): QueryContext['expectedResultType'] {
    if (query.includes('analyze') || query.includes('trend') || query.includes('insight')) return 'analysis';
    if (query.includes('create') || query.includes('make') || query.includes('build')) return 'action';
    if (query.includes('data') || query.includes('numbers') || query.includes('statistics')) return 'data';
    
    return 'document';
  }

  // Helper methods for suggestions
  private generateQuestionSuggestions(_query: string): string[] {
    return [
      'What are the key points in this document?',
      'How can I improve this process?',
      'What are the next steps?',
      'Who is responsible for this task?'
    ];
  }

  private generateCommandSuggestions(_query: string): string[] {
    return [
      'Show me recent documents',
      'Find all budget-related files',
      'List team meeting notes',
      'Display project status reports'
    ];
  }

  private generateAnalysisSuggestions(_query: string): string[] {
    return [
      'Analyze spending trends',
      'Compare performance metrics',
      'Generate summary report',
      'Identify key insights'
    ];
  }

  private generateGeneralSuggestions(_query: string): string[] {
    return [
      'Search for similar documents',
      'Find related content',
      'Browse recent activity',
      'Explore trending topics'
    ];
  }

  private generateEntitySuggestions(entities: QueryEntity[]): string[] {
    const suggestions: string[] = [];
    
    entities.forEach(entity => {
      switch (entity.type) {
        case 'date':
          suggestions.push(`Find documents from ${entity.value}`);
          break;
        case 'project':
          suggestions.push(`Show all ${entity.value} related content`);
          break;
        case 'document':
          suggestions.push(`Find ${entity.value} files`);
          break;
      }
    });
    
    return suggestions;
  }

  private generateDomainSuggestions(domain: string): string[] {
    const domainSuggestions = {
      'financial': ['Budget analysis', 'Expense reports', 'Financial planning'],
      'technical': ['API documentation', 'Code reviews', 'Technical specifications'],
      'legal': ['Contract reviews', 'Compliance reports', 'Legal documents'],
      'business': ['Strategy documents', 'Business plans', 'Market analysis']
    };
    
    return domainSuggestions[domain as keyof typeof domainSuggestions] || [];
  }

  // Utility methods
  private normalizeDate(dateStr: string): string {
    try {
      return new Date(dateStr).toISOString();
    } catch {
      return dateStr;
    }
  }

  private isCommonWord(word: string): boolean {
    const commonWords = ['The', 'This', 'That', 'These', 'Those', 'A', 'An', 'And', 'Or', 'But'];
    return commonWords.includes(word);
  }

  private calculateIntentConfidence(query: string, intentType: string, entities: QueryEntity[]): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on intent indicators
    const intentIndicators = {
      'question': ['what', 'how', 'when', 'where', 'why', 'who', 'which'],
      'command': ['show', 'find', 'get', 'list', 'create', 'delete'],
      'comparison': ['compare', 'versus', 'vs', 'difference'],
      'analysis': ['analyze', 'trend', 'pattern', 'insight']
    };
    
    const indicators = intentIndicators[intentType as keyof typeof intentIndicators] || [];
    const queryLower = query.toLowerCase();
    const indicatorCount = indicators.filter(indicator => queryLower.includes(indicator)).length;
    
    confidence += indicatorCount * 0.1;
    
    // Boost confidence based on entities
    confidence += entities.length * 0.05;
    
    return Math.min(1.0, confidence);
  }

  private calculateOverallConfidence(
    intent: QueryIntent,
    searchTerms: string[],
    _filters: Record<string, unknown>
  ): number {
    let confidence = intent.confidence;
    
    // Boost confidence for more specific queries
    if (searchTerms.length > 2) confidence += 0.1;
    if (Object.keys(_filters).length > 0) confidence += 0.1;
    if (intent.entities.length > 0) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  // Cache management
  private getCachedProcessing(query: string, options: QueryProcessingOptions): ProcessedQuery | null {
    try {
      const key = this.getCacheKey(query, options);
      const cached = LocalStorageManager.getItem<{
        data: ProcessedQuery;
        timestamp: number;
      }>(`query_processing_${key}`);

      if (!cached) {
        return null;
      }

      return {
        ...cached.data,
        createdAt: new Date(cached.data.createdAt)
      };
    } catch (error) {
      logger.error('Failed to get cached processing', error as Error, {
        operation: 'getCachedProcessing',
        query: query
      });
      return null;
    }
  }

  private cacheProcessing(query: string, options: QueryProcessingOptions, result: ProcessedQuery): void {
    try {
      const key = this.getCacheKey(query, options);
      const cacheData = {
        data: result,
        timestamp: Date.now()
      };

      // Use LocalStorageManager with 1-hour TTL
      const success = LocalStorageManager.setItem(
        `query_processing_${key}`,
        cacheData,
        { ttl: 60 * 60 * 1000 } // 1 hour
      );

      if (!success) {
        logger.warn('Failed to cache query processing result', {
          operation: 'cacheProcessing',
          query: query,
          key: key
        });
      }
    } catch (error) {
      logger.error('Failed to cache processing', error as Error, {
        operation: 'cacheProcessing',
        query: query
      });
    }
  }

  private getCacheKey(query: string, options: QueryProcessingOptions): string {
    return `${query}_${JSON.stringify(options)}`;
  }

  // Public utility methods
  public clearCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  public getCacheStatistics(): { size: number; entries: number } {
    if (typeof window === 'undefined') return { size: 0, entries: 0 };
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return { size: 0, entries: 0 };
      
      const cache = JSON.parse(stored);
      const entries = Object.keys(cache).length;
      const size = stored.length;
      
      return { size, entries };
    } catch (error) {
      logger.error('Failed to get cache statistics', error as Error, {
        operation: 'getCacheStatistics'
      });
      return { size: 0, entries: 0 };
    }
  }
}

export const queryProcessor = QueryProcessor.getInstance();
