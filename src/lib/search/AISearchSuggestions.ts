import { SearchHistoryItem } from './SearchHistoryManager';
import { SearchResult } from '@/types/integrations';

export interface SearchSuggestion {
  id: string;
  query: string;
  type: 'history' | 'trending' | 'related' | 'autocomplete' | 'semantic';
  confidence: number;
  reason: string;
  category?: string;
  metadata?: {
    source?: string;
    resultCount?: number;
    lastUsed?: Date;
    tags?: string[];
  };
}

export interface SuggestionContext {
  currentQuery: string;
  searchHistory: SearchHistoryItem[];
  recentResults: SearchResult[];
  userPreferences: {
    preferredSources: string[];
    commonFilters: Record<string, any>;
    searchPatterns: string[];
  };
}

class AISearchSuggestions {
  private static instance: AISearchSuggestions;
  private readonly STORAGE_KEY = 'sphyr-ai-suggestions';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private suggestionCache: Map<string, { suggestions: SearchSuggestion[]; timestamp: number }> = new Map();

  public static getInstance(): AISearchSuggestions {
    if (!AISearchSuggestions.instance) {
      AISearchSuggestions.instance = new AISearchSuggestions();
    }
    return AISearchSuggestions.instance;
  }

  // Main suggestion generation method
  public async generateSuggestions(
    query: string,
    context: SuggestionContext,
    limit: number = 8
  ): Promise<SearchSuggestion[]> {
    if (!query.trim()) {
      return this.getDefaultSuggestions(context);
    }

    // Check cache first
    const cacheKey = this.getCacheKey(query, context);
    const cached = this.suggestionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.suggestions.slice(0, limit);
    }

    // Generate suggestions
    const suggestions = await Promise.all([
      this.getHistorySuggestions(query, context),
      this.getAutocompleteSuggestions(query, context),
      this.getRelatedSuggestions(query, context),
      this.getSemanticSuggestions(query, context),
      this.getTrendingSuggestions(query, context)
    ]);

    // Flatten and deduplicate
    const allSuggestions = suggestions.flat();
    const uniqueSuggestions = this.deduplicateSuggestions(allSuggestions);

    // Sort by confidence and relevance
    const sortedSuggestions = this.rankSuggestions(uniqueSuggestions, query, context);

    // Cache results
    this.suggestionCache.set(cacheKey, {
      suggestions: sortedSuggestions,
      timestamp: Date.now()
    });

    return sortedSuggestions.slice(0, limit);
  }

  // History-based suggestions
  private async getHistorySuggestions(
    query: string,
    context: SuggestionContext
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Exact matches
    const exactMatches = context.searchHistory
      .filter(item => item.query.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .map(item => ({
        id: `history_${item.id}`,
        query: item.query,
        type: 'history' as const,
        confidence: 0.9,
        reason: 'From your search history',
        metadata: {
          source: item.source,
          resultCount: item.resultCount,
          lastUsed: item.timestamp,
          tags: item.tags
        }
      }));

    suggestions.push(...exactMatches);

    // Partial matches
    const partialMatches = context.searchHistory
      .filter(item => {
        const words = queryLower.split(' ');
        const itemWords = item.query.toLowerCase().split(' ');
        return words.some(word => itemWords.some(itemWord => itemWord.includes(word)));
      })
      .filter(item => !exactMatches.some(s => s.query === item.query))
      .slice(0, 2)
      .map(item => ({
        id: `history_partial_${item.id}`,
        query: item.query,
        type: 'history' as const,
        confidence: 0.7,
        reason: 'Similar to your previous searches',
        metadata: {
          source: item.source,
          resultCount: item.resultCount,
          lastUsed: item.timestamp,
          tags: item.tags
        }
      }));

    suggestions.push(...partialMatches);

    return suggestions;
  }

  // Autocomplete suggestions
  private async getAutocompleteSuggestions(
    query: string,
    context: SuggestionContext
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Common business terms
    const businessTerms = [
      'budget', 'report', 'meeting', 'contract', 'invoice', 'proposal',
      'timeline', 'milestone', 'deadline', 'review', 'approval', 'change',
      'project', 'client', 'vendor', 'supplier', 'delivery', 'payment',
      'agreement', 'documentation', 'specification', 'requirement'
    ];

    const matchingTerms = businessTerms
      .filter(term => term.includes(queryLower) || queryLower.includes(term))
      .slice(0, 2)
      .map(term => ({
        id: `autocomplete_${term}`,
        query: term,
        type: 'autocomplete' as const,
        confidence: 0.6,
        reason: 'Common business term',
        category: 'Business'
      }));

    suggestions.push(...matchingTerms);

    // Common query patterns
    const patterns = [
      `${query} report`,
      `${query} document`,
      `${query} meeting`,
      `${query} budget`,
      `${query} timeline`
    ];

    const patternSuggestions = patterns
      .slice(0, 2)
      .map(pattern => ({
        id: `pattern_${pattern.replace(/\s+/g, '_')}`,
        query: pattern,
        type: 'autocomplete' as const,
        confidence: 0.5,
        reason: 'Common search pattern',
        category: 'Pattern'
      }));

    suggestions.push(...patternSuggestions);

    return suggestions;
  }

  // Related suggestions based on context
  private async getRelatedSuggestions(
    query: string,
    context: SuggestionContext
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Analyze recent results to suggest related queries
    if (context.recentResults.length > 0) {
      const commonTags = this.extractCommonTags(context.recentResults);
      const relatedQueries = commonTags
        .filter(tag => !queryLower.includes(tag.toLowerCase()))
        .slice(0, 2)
        .map(tag => ({
          id: `related_${tag}`,
          query: tag,
          type: 'related' as const,
          confidence: 0.6,
          reason: 'Related to your recent results',
          category: 'Related'
        }));

      suggestions.push(...relatedQueries);
    }

    // Suggest based on user preferences
    if (context.userPreferences.preferredSources.length > 0) {
      const sourceSuggestions = context.userPreferences.preferredSources
        .slice(0, 1)
        .map(source => ({
          id: `source_${source}`,
          query: `${query} from ${source}`,
          type: 'related' as const,
          confidence: 0.5,
          reason: `Search in your preferred source: ${source}`,
          category: 'Source'
        }));

      suggestions.push(...sourceSuggestions);
    }

    return suggestions;
  }

  // Semantic suggestions using AI-like logic
  private async getSemanticSuggestions(
    query: string,
    context: SuggestionContext
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Synonym suggestions
    const synonyms = this.getSynonyms(queryLower);
    const synonymSuggestions = synonyms
      .filter(synonym => synonym !== queryLower)
      .slice(0, 2)
      .map(synonym => ({
        id: `synonym_${synonym}`,
        query: synonym,
        type: 'semantic' as const,
        confidence: 0.7,
        reason: 'Similar meaning',
        category: 'Semantic'
      }));

    suggestions.push(...synonymSuggestions);

    // Contextual suggestions based on query intent
    const intentSuggestions = this.getIntentBasedSuggestions(query, context);
    suggestions.push(...intentSuggestions);

    return suggestions;
  }

  // Trending suggestions
  private async getTrendingSuggestions(
    query: string,
    context: SuggestionContext
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    // Get trending terms from search history
    const trendingTerms = this.getTrendingTerms(context.searchHistory);
    const relevantTrending = trendingTerms
      .filter(term => !query.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 1)
      .map(term => ({
        id: `trending_${term}`,
        query: term,
        type: 'trending' as const,
        confidence: 0.4,
        reason: 'Trending in your searches',
        category: 'Trending'
      }));

    suggestions.push(...relevantTrending);

    return suggestions;
  }

  // Default suggestions when no query
  private getDefaultSuggestions(context: SuggestionContext): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Recent searches
    const recentSearches = context.searchHistory
      .slice(0, 3)
      .map(item => ({
        id: `recent_${item.id}`,
        query: item.query,
        type: 'history' as const,
        confidence: 0.8,
        reason: 'Recent search',
        metadata: {
          source: item.source,
          resultCount: item.resultCount,
          lastUsed: item.timestamp
        }
      }));

    suggestions.push(...recentSearches);

    // Popular business queries
    const popularQueries = [
      'Q4 budget planning',
      'client meeting notes',
      'project timeline',
      'expense reports',
      'contract agreements'
    ];

    const popularSuggestions = popularQueries
      .slice(0, 3)
      .map(query => ({
        id: `popular_${query.replace(/\s+/g, '_')}`,
        query,
        type: 'trending' as const,
        confidence: 0.6,
        reason: 'Popular business search',
        category: 'Popular'
      }));

    suggestions.push(...popularSuggestions);

    return suggestions;
  }

  // Helper methods
  private getCacheKey(query: string, context: SuggestionContext): string {
    const contextHash = JSON.stringify({
      sources: context.userPreferences.preferredSources,
      recentCount: context.recentResults.length
    });
    return `${query}_${contextHash}`;
  }

  private deduplicateSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      if (seen.has(suggestion.query)) {
        return false;
      }
      seen.add(suggestion.query);
      return true;
    });
  }

  private rankSuggestions(
    suggestions: SearchSuggestion[],
    query: string,
    context: SuggestionContext
  ): SearchSuggestion[] {
    return suggestions.sort((a, b) => {
      // Primary sort by confidence
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }

      // Secondary sort by type priority
      const typePriority = { history: 4, semantic: 3, related: 2, autocomplete: 1, trending: 0 };
      const aPriority = typePriority[a.type] || 0;
      const bPriority = typePriority[b.type] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // Tertiary sort by query length (prefer more specific queries)
      return a.query.length - b.query.length;
    });
  }

  private extractCommonTags(results: SearchResult[]): string[] {
    const tagCounts: Record<string, number> = {};
    
    results.forEach(result => {
      if (result.tags) {
        result.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  private getSynonyms(word: string): string[] {
    const synonymMap: Record<string, string[]> = {
      'budget': ['financial plan', 'cost estimate', 'expense plan'],
      'report': ['document', 'summary', 'analysis'],
      'meeting': ['conference', 'discussion', 'session'],
      'contract': ['agreement', 'deal', 'arrangement'],
      'invoice': ['bill', 'statement', 'charge'],
      'proposal': ['suggestion', 'plan', 'recommendation'],
      'timeline': ['schedule', 'deadline', 'milestone'],
      'project': ['initiative', 'task', 'assignment'],
      'client': ['customer', 'buyer', 'patron'],
      'vendor': ['supplier', 'provider', 'contractor']
    };

    return synonymMap[word] || [];
  }

  private getIntentBasedSuggestions(query: string, context: SuggestionContext): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Detect intent and suggest accordingly
    if (queryLower.includes('budget') || queryLower.includes('cost')) {
      suggestions.push({
        id: 'intent_budget_related',
        query: 'expense reports',
        type: 'semantic',
        confidence: 0.6,
        reason: 'Related to financial planning',
        category: 'Intent'
      });
    }

    if (queryLower.includes('meeting') || queryLower.includes('conference')) {
      suggestions.push({
        id: 'intent_meeting_related',
        query: 'meeting notes',
        type: 'semantic',
        confidence: 0.6,
        reason: 'Related to meetings',
        category: 'Intent'
      });
    }

    if (queryLower.includes('project') || queryLower.includes('task')) {
      suggestions.push({
        id: 'intent_project_related',
        query: 'project timeline',
        type: 'semantic',
        confidence: 0.6,
        reason: 'Related to project management',
        category: 'Intent'
      });
    }

    return suggestions;
  }

  private getTrendingTerms(history: SearchHistoryItem[]): string[] {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSearches = history.filter(item => item.timestamp >= thirtyDaysAgo);
    const termCounts: Record<string, number> = {};

    recentSearches.forEach(item => {
      const words = item.query.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 3) { // Only consider words longer than 3 characters
          termCounts[word] = (termCounts[word] || 0) + 1;
        }
      });
    });

    return Object.entries(termCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([term]) => term);
  }

  // Public utility methods
  public clearCache(): void {
    this.suggestionCache.clear();
  }

  public getCacheSize(): number {
    return this.suggestionCache.size;
  }
}

export const aiSearchSuggestions = AISearchSuggestions.getInstance();
