import { SearchResult } from '@/types/integrations';
import { ContentTag } from './ContentTagger';
import { logger } from '../logger';
import { executeWithAIFallback } from '@/lib/ai/ai-fallback-manager';
import { CerebrasClient } from '@/lib/ai/cerebras-client';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';
import { TIME_CONSTANTS, STORAGE_LIMITS, CONTENT_LIMITS } from '@/lib/constants';

// Type guards for safe type checking
function isSearchResult(data: unknown): data is SearchResult {
  return (
    data !== null &&
    typeof data === 'object' &&
    'id' in data &&
    'title' in data &&
    'content' in data &&
    'source' in data
  );
}

function isSearchResultArray(data: unknown): data is SearchResult[] {
  return Array.isArray(data) && data.every(isSearchResult);
}

function isRankedResult(data: unknown): data is RankedResult {
  return (
    isSearchResult(data) &&
    'rankingScore' in data &&
    typeof (data as any).rankingScore === 'number'
  );
}

export interface RankingFactors {
  relevance: number;
  recency: number;
  authority: number;
  userEngagement: number;
  contentQuality: number;
  personalization: number;
}

export interface RankingWeights {
  relevance: number;
  recency: number;
  authority: number;
  userEngagement: number;
  contentQuality: number;
  personalization: number;
}

export interface RankedResult extends SearchResult {
  rankingScore: number;
  rankingFactors: RankingFactors;
  rankingExplanation: string;
  boostedBy?: string[];
  penalizedBy?: string[];
}

export interface RankingContext {
  query: string;
  userHistory: SearchResult[];
  userTags: ContentTag[];
  userPreferences: {
    preferredSources: string[];
    interestedTopics: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    timeAvailability: 'limited' | 'moderate' | 'extensive';
  };
  searchFilters: Record<string, any>;
  searchTime: Date;
}

export interface RankingOptions {
  weights: RankingWeights;
  boostRecent: boolean;
  boostPersonalized: boolean;
  boostHighQuality: boolean;
  penalizeLowEngagement: boolean;
  maxResults: number;
  explainRanking: boolean;
}

class SearchRanker {
  private static instance: SearchRanker;
  private readonly STORAGE_KEY = 'sphyr-search-rankings';
  private readonly MAX_RANKINGS = STORAGE_LIMITS.MAX_RANKINGS;

  public static getInstance(): SearchRanker {
    if (!SearchRanker.instance) {
      SearchRanker.instance = new SearchRanker();
    }
    return SearchRanker.instance;
  }

  // Main ranking method
  public async rankResults(
    results: SearchResult[],
    context: RankingContext,
    options: RankingOptions
  ): Promise<RankedResult[]> {
    try {
      return executeWithAIFallback(
        // AI operation
        async () => {
          const cerebrasClient = new CerebrasClient();
          const response = await cerebrasClient.rankResults({
            query: context.query,
            results: results.map(r => ({
              id: r.id,
              title: r.title,
              content: r.content,
              source: r.source,
              integrationType: r.integrationType || 'unknown',
              metadata: r.metadata || {},
              createdAt: r.createdAt
            })),
            context: {
              userHistory: (context.userHistory || []).map(result => ({
                id: result.id || '',
                query: result.title || result.content || '',
                timestamp: new Date().getTime(),
                resultsCount: 1,
                userId: 'anonymous',
                clickedResults: []
              })),
              recentSearches: (context.userHistory || []).map(result => ({
                id: result.id || '',
                query: result.title || result.content || '',
                timestamp: new Date().getTime(),
                resultsCount: 1,
                userId: 'anonymous',
                clickedResults: []
              })),
              activeIntegrations: (context.userPreferences?.preferredSources || []).map(source => ({
                provider: source,
                connected: true,
                connectedAt: new Date().toISOString(),
                lastSync: new Date().toISOString(),
                permissions: [],
                scopes: []
              })),
              organizationData: {
                id: 'default',
                name: 'Default Organization',
                settings: {},
                integrations: []
              }
            }
          });
          
          // Convert AI response to our format
          const aiRankedResults: RankedResult[] = response.rankedResults.map((ranked, index) => ({
            ...results[index],
            rankingScore: ranked.relevanceScore,
            rankingExplanation: ranked.rankingReason,
            rankingFactors: {
              relevance: ranked.relevanceScore,
              recency: 0.5, // Default values for AI results
              authority: 0.5,
              userEngagement: 0.5,
              contentQuality: 0.5,
              personalization: 0.5
            },
            boostedBy: [],
            penalizedBy: []
          }));
          
          // Sort by ranking score
          const sortedResults = aiRankedResults.sort((a, b) => b.rankingScore - a.rankingScore);
          
          // Save ranking data
          this.saveRankingData(context.query, sortedResults);
          
          return sortedResults.slice(0, options.maxResults);
        },
        // Fallback operation
        () => this.fallbackRanking(results, context, options),
        // Operation name for logging
        'search result ranking'
      );
    } catch (error) {
      logger.error('Search ranking failed', error as Error, {
        operation: 'rankResults',
        resultsCount: results.length
      });
      throw new Error(`Failed to rank results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fallback ranking using rule-based logic
  private fallbackRanking(
    results: SearchResult[],
    context: RankingContext,
    options: RankingOptions
  ): RankedResult[] {
    const rankedResults: RankedResult[] = [];
    
    for (const result of results) {
      const rankingFactors = this.calculateRankingFactors(result, context, options);
      const rankingScore = this.calculateRankingScore(rankingFactors, options.weights);
      const rankingExplanation = options.explainRanking 
        ? this.generateRankingExplanation(rankingFactors, result, context)
        : '';
      
      const rankedResult: RankedResult = {
        ...result,
        rankingScore,
        rankingFactors,
        rankingExplanation,
        boostedBy: this.getBoostReasons(rankingFactors),
        penalizedBy: this.getPenaltyReasons(rankingFactors)
      };
      
      rankedResults.push(rankedResult);
    }
    
    // Sort by ranking score
    const sortedResults = rankedResults.sort((a, b) => b.rankingScore - a.rankingScore);
    
    // Save ranking data
    this.saveRankingData(context.query, sortedResults);
    
    return sortedResults.slice(0, options.maxResults);
  }

  // Calculate ranking factors for a result
  private calculateRankingFactors(
    result: SearchResult,
    context: RankingContext,
    _options: RankingOptions
  ): RankingFactors {
    const factors: RankingFactors = {
      relevance: this.calculateRelevance(result, context.query),
      recency: this.calculateRecency(result, context.searchTime),
      authority: this.calculateAuthority(result, context),
      userEngagement: this.calculateUserEngagement(result, context),
      contentQuality: this.calculateContentQuality(result),
      personalization: this.calculatePersonalization(result, context)
    };
    
    return factors;
  }

  // Calculate relevance score
  private calculateRelevance(result: SearchResult, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const titleWords = result.title.toLowerCase().split(/\s+/);
    const contentWords = result.content.toLowerCase().split(/\s+/);
    
    let relevanceScore = 0;
    
    // Title relevance (higher weight)
    queryWords.forEach(queryWord => {
      if (titleWords.includes(queryWord)) {
        relevanceScore += 0.3;
      }
    });
    
    // Content relevance
    queryWords.forEach(queryWord => {
      const contentMatches = contentWords.filter(word => word.includes(queryWord)).length;
      relevanceScore += (contentMatches / contentWords.length) * 0.2;
    });
    
    // Exact phrase matching
    if (result.title.toLowerCase().includes(query.toLowerCase())) {
      relevanceScore += 0.4;
    }
    
    if (result.content.toLowerCase().includes(query.toLowerCase())) {
      relevanceScore += 0.2;
    }
    
    // Tag relevance
    if (result.tags) {
      const tagMatches = result.tags.filter(tag => 
        queryWords.some(word => tag.toLowerCase().includes(word))
      ).length;
      relevanceScore += (tagMatches / result.tags.length) * 0.1;
    }
    
    return Math.min(1.0, relevanceScore);
  }

  // Calculate recency score
  private calculateRecency(result: SearchResult, searchTime: Date): number {
    const resultDate = new Date(result.createdAt);
    const daysDiff = (searchTime.getTime() - resultDate.getTime()) / TIME_CONSTANTS.MILLISECONDS_PER_DAY;
    
    // Exponential decay: newer documents get higher scores
    if (daysDiff <= 1) return 1.0;
    if (daysDiff <= 7) return 0.8;
    if (daysDiff <= 30) return 0.6;
    if (daysDiff <= 90) return 0.4;
    if (daysDiff <= 365) return 0.2;
    return 0.1;
  }

  // Calculate authority score
  private calculateAuthority(result: SearchResult, context: RankingContext): number {
    let authorityScore = 0.5; // Base score
    
    // Source authority
    const sourceAuthority = {
      'google': 0.9,
      'notion': 0.8,
      'slack': 0.7,
      'github': 0.8,
      'confluence': 0.8,
      'jira': 0.7,
      'asana': 0.7,
      'trello': 0.6
    };
    
    authorityScore = sourceAuthority[result.source as keyof typeof sourceAuthority] || 0.5;
    
    // Author authority (if available)
    if (result.author) {
      // Check if author is in user's preferred contacts or frequently appears
      const authorFrequency = context.userHistory.filter(doc => doc.author === result.author).length;
      if (authorFrequency > 0) {
        authorityScore += 0.1;
      }
    }
    
    // Content length (longer content often indicates more authority)
    const wordCount = result.content.split(' ').length;
    if (wordCount > CONTENT_LIMITS.MAX_WORD_COUNT_FOR_AUTHORITY) authorityScore += 0.1;
    if (wordCount > CONTENT_LIMITS.MAX_WORD_COUNT_FOR_EXTENDED_QUALITY) authorityScore += 0.1;
    
    // URL authority (if available)
    if (result.url) {
      if (result.url.includes('docs.google.com')) authorityScore += 0.1;
      if (result.url.includes('notion.so')) authorityScore += 0.1;
      if (result.url.includes('github.com')) authorityScore += 0.1;
    }
    
    return Math.min(1.0, authorityScore);
  }

  // Calculate user engagement score
  private calculateUserEngagement(result: SearchResult, context: RankingContext): number {
    let engagementScore = 0.5; // Base score
    
    // Check if user has interacted with similar content
    const similarDocs = context.userHistory.filter(doc => {
      const similarity = this.calculateDocumentSimilarity(result, doc);
      return similarity > 0.3;
    });
    
    if (similarDocs.length > 0) {
      engagementScore += 0.2;
    }
    
    // Check if result matches user's preferred sources
    if (context.userPreferences.preferredSources.includes(result.source)) {
      engagementScore += 0.2;
    }
    
    // Check if result matches user's interested topics
    if (result.tags) {
      const topicMatches = result.tags.filter(tag => 
        context.userPreferences.interestedTopics.some(topic => 
          tag.toLowerCase().includes(topic.toLowerCase())
        )
      ).length;
      
      if (topicMatches > 0) {
        engagementScore += (topicMatches / result.tags.length) * 0.1;
      }
    }
    
    // Check if result is from user's recent searches
    const recentSearches = context.userHistory.slice(0, 10);
    const isRecent = recentSearches.some(doc => doc.id === result.id);
    if (isRecent) {
      engagementScore += 0.1;
    }
    
    return Math.min(1.0, engagementScore);
  }

  // Calculate content quality score
  private calculateContentQuality(result: SearchResult): number {
    let qualityScore = 0.5; // Base score
    
    // Content length
    const wordCount = result.content.split(' ').length;
    if (wordCount < 50) qualityScore -= 0.2;
    else if (wordCount > CONTENT_LIMITS.MAX_WORD_COUNT_FOR_QUALITY) qualityScore += 0.1;
    else if (wordCount > CONTENT_LIMITS.MAX_WORD_COUNT_FOR_AUTHORITY) qualityScore += 0.2;
    
    // Title quality
    if (result.title.length > 10 && result.title.length < 100) {
      qualityScore += 0.1;
    }
    
    // Content structure
    const hasStructure = /[•\-\*]|\d+\./.test(result.content);
    if (hasStructure) qualityScore += 0.1;
    
    // Tag presence
    if (result.tags && result.tags.length > 0) {
      qualityScore += 0.1;
    }
    
    // Author presence
    if (result.author) {
      qualityScore += 0.1;
    }
    
    // URL presence
    if (result.url) {
      qualityScore += 0.1;
    }
    
    return Math.min(1.0, Math.max(0.0, qualityScore));
  }

  // Calculate personalization score
  private calculatePersonalization(result: SearchResult, context: RankingContext): number {
    let personalizationScore = 0.0;
    
    // User tag matches
    if (result.tags && context.userTags.length > 0) {
      const tagMatches = result.tags.filter(tag => 
        context.userTags.some(userTag => 
          userTag.name.toLowerCase() === tag.toLowerCase()
        )
      ).length;
      
      personalizationScore += (tagMatches / result.tags.length) * 0.3;
    }
    
    // User history similarity
    const historySimilarity = context.userHistory
      .map(doc => this.calculateDocumentSimilarity(result, doc))
      .reduce((max, similarity) => Math.max(max, similarity), 0);
    
    personalizationScore += historySimilarity * 0.4;
    
    // User preference matches
    if (context.userPreferences.preferredSources.includes(result.source)) {
      personalizationScore += 0.2;
    }
    
    // Topic interest matches
    if (result.tags) {
      const topicMatches = result.tags.filter(tag => 
        context.userPreferences.interestedTopics.some(topic => 
          tag.toLowerCase().includes(topic.toLowerCase())
        )
      ).length;
      
      personalizationScore += (topicMatches / result.tags.length) * 0.1;
    }
    
    return Math.min(1.0, personalizationScore);
  }

  // Calculate document similarity
  private calculateDocumentSimilarity(doc1: SearchResult, doc2: SearchResult): number {
    const words1 = doc1.content.toLowerCase().split(/\s+/);
    const words2 = doc2.content.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // Calculate final ranking score
  private calculateRankingScore(factors: RankingFactors, weights: RankingWeights): number {
    const score = 
      factors.relevance * weights.relevance +
      factors.recency * weights.recency +
      factors.authority * weights.authority +
      factors.userEngagement * weights.userEngagement +
      factors.contentQuality * weights.contentQuality +
      factors.personalization * weights.personalization;
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  // Generate ranking explanation
  private generateRankingExplanation(
    factors: RankingFactors,
    result: SearchResult,
    context: RankingContext
  ): string {
    const explanations: string[] = [];
    
    if (factors.relevance > 0.7) {
      explanations.push('Highly relevant to your search query');
    } else if (factors.relevance > 0.4) {
      explanations.push('Moderately relevant to your search query');
    }
    
    if (factors.recency > 0.8) {
      explanations.push('Very recent content');
    } else if (factors.recency > 0.5) {
      explanations.push('Recent content');
    }
    
    if (factors.authority > 0.8) {
      explanations.push('From a highly authoritative source');
    } else if (factors.authority > 0.6) {
      explanations.push('From a reliable source');
    }
    
    if (factors.userEngagement > 0.7) {
      explanations.push('Matches your interests and preferences');
    } else if (factors.userEngagement > 0.4) {
      explanations.push('Somewhat matches your preferences');
    }
    
    if (factors.contentQuality > 0.8) {
      explanations.push('High-quality, well-structured content');
    } else if (factors.contentQuality > 0.6) {
      explanations.push('Good quality content');
    }
    
    if (factors.personalization > 0.7) {
      explanations.push('Highly personalized for you');
    } else if (factors.personalization > 0.4) {
      explanations.push('Somewhat personalized');
    }
    
    return explanations.length > 0 
      ? explanations.join('; ') 
      : 'Standard ranking based on relevance';
  }

  // Get boost reasons
  private getBoostReasons(factors: RankingFactors): string[] {
    const reasons: string[] = [];
    
    if (factors.relevance > 0.8) reasons.push('high_relevance');
    if (factors.recency > 0.8) reasons.push('recent_content');
    if (factors.authority > 0.8) reasons.push('authoritative_source');
    if (factors.userEngagement > 0.8) reasons.push('user_preference_match');
    if (factors.contentQuality > 0.8) reasons.push('high_quality');
    if (factors.personalization > 0.8) reasons.push('highly_personalized');
    
    return reasons;
  }

  // Get penalty reasons
  private getPenaltyReasons(factors: RankingFactors): string[] {
    const reasons: string[] = [];
    
    if (factors.relevance < 0.3) reasons.push('low_relevance');
    if (factors.recency < 0.3) reasons.push('old_content');
    if (factors.authority < 0.3) reasons.push('low_authority');
    if (factors.userEngagement < 0.3) reasons.push('low_engagement');
    if (factors.contentQuality < 0.3) reasons.push('low_quality');
    if (factors.personalization < 0.3) reasons.push('not_personalized');
    
    return reasons;
  }

  // Save ranking data
  private saveRankingData(query: string, results: RankedResult[]): void {
    try {
      const rankingData = {
        results: results.map(r => ({
          ...r,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        })),
        timestamp: Date.now()
      };

      // Use LocalStorageManager with 24-hour TTL
      const success = LocalStorageManager.setItem(
        `ranking_${query}`,
        rankingData,
        { ttl: TIME_CONSTANTS.SEARCH_RANKING_CACHE_TTL }
      );

      if (!success) {
        logger.warn('Failed to save ranking data to localStorage', {
          operation: 'saveRankingData',
          query: query,
          resultsCount: results.length
        });
      }
    } catch (error) {
      logger.error('Failed to save ranking data', error as Error, {
        operation: 'saveRankingData',
        query: query
      });
    }
  }

  // Get ranking data
  public getRankingData(query: string): RankedResult[] | null {
    try {
      const data = LocalStorageManager.getItem<{
        results: RankedResult[];
        timestamp: number;
      }>(`ranking_${query}`);

      if (!data) {
        return null;
      }

      if (isSearchResultArray(data.results)) {
        return data.results.map((r: RankedResult) => ({
          ...r,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }));
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get ranking data', error as Error, {
        operation: 'getRankingData',
        query: query
      });
      return null;
    }
  }

  // Clear ranking data
  public clearRankingData(): void {
    try {
      // Clear all ranking-related items
      const keys = ['ranking_'];
      keys.forEach(_prefix => {
        // Note: LocalStorageManager doesn't have a method to clear by prefix yet
        // For now, we'll use the old method but with better error handling
        if (typeof window !== 'undefined') {
          localStorage.removeItem(this.STORAGE_KEY);
        }
      });
    } catch (error) {
      logger.error('Failed to clear ranking data', error as Error, {
        operation: 'clearRankingData'
      });
    }
  }

  // Get ranking statistics
  public getRankingStatistics(): {
    totalQueries: number;
    averageResultsPerQuery: number;
    averageRankingScore: number;
    topBoostReasons: Array<{ reason: string; count: number }>;
    topPenaltyReasons: Array<{ reason: string; count: number }>;
  } {
    if (typeof window === 'undefined') {
      return {
        totalQueries: 0,
        averageResultsPerQuery: 0,
        averageRankingScore: 0,
        topBoostReasons: [],
        topPenaltyReasons: []
      };
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return {
          totalQueries: 0,
          averageResultsPerQuery: 0,
          averageRankingScore: 0,
          topBoostReasons: [],
          topPenaltyReasons: []
        };
      }
      
      const rankings = JSON.parse(stored);
      const queries = Object.keys(rankings);
      
      let totalResults = 0;
      let totalScore = 0;
      const boostCounts: Record<string, number> = {};
      const penaltyCounts: Record<string, number> = {};
      
      queries.forEach(query => {
        const results = rankings[query].results;
        totalResults += results.length;
        
        if (isSearchResultArray(results)) {
          results.forEach((result) => {
            if (isRankedResult(result)) {
              totalScore += result.rankingScore;
              
              if (result.boostedBy) {
                result.boostedBy.forEach((reason: string) => {
                  boostCounts[reason] = (boostCounts[reason] || 0) + 1;
                });
              }
              
              if (result.penalizedBy) {
                result.penalizedBy.forEach((reason: string) => {
                  penaltyCounts[reason] = (penaltyCounts[reason] || 0) + 1;
                });
              }
            }
          });
        }
      });
      
      const topBoostReasons = Object.entries(boostCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const topPenaltyReasons = Object.entries(penaltyCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        totalQueries: queries.length,
        averageResultsPerQuery: queries.length > 0 ? totalResults / queries.length : 0,
        averageRankingScore: totalResults > 0 ? totalScore / totalResults : 0,
        topBoostReasons,
        topPenaltyReasons
      };
    } catch (error) {
      logger.error('Failed to get ranking statistics', error as Error, {
        operation: 'getRankingStatistics'
      });
      return {
        totalQueries: 0,
        averageResultsPerQuery: 0,
        averageRankingScore: 0,
        topBoostReasons: [],
        topPenaltyReasons: []
      };
    }
  }
}

export const searchRanker = SearchRanker.getInstance();
