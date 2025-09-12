import { SearchResult } from '@/types/integrations';
import { logger } from '@/lib/logger';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';

export interface ContentTag {
  id: string;
  name: string;
  category: 'topic' | 'sentiment' | 'entity' | 'action' | 'priority' | 'department' | 'project' | 'custom';
  confidence: number;
  source: 'ai' | 'user' | 'system' | 'template';
  metadata?: {
    description?: string;
    synonyms?: string[];
    parentTag?: string;
    color?: string;
    icon?: string;
  };
}

export interface TaggingResult {
  documentId: string;
  tags: ContentTag[];
  confidence: number;
  processingTime: number;
  createdAt: Date;
  metadata: {
    originalWordCount: number;
    tagDensity: number;
    categoryDistribution: Record<string, number>;
  };
}

export interface TaggingOptions {
  includeSentiment: boolean;
  includeEntities: boolean;
  includeTopics: boolean;
  includeActions: boolean;
  includeCustomTags: boolean;
  maxTags: number;
  minConfidence: number;
  language: string;
  domain: 'business' | 'technical' | 'legal' | 'financial' | 'general';
}

export interface TagCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  rules: TagRule[];
}

export interface TagRule {
  id: string;
  pattern: string;
  type: 'regex' | 'keyword' | 'phrase' | 'context';
  confidence: number;
  category: string;
  metadata?: Record<string, any>;
}

class ContentTagger {
  private static instance: ContentTagger;
  private readonly STORAGE_KEY = 'sphyr-content-tags';
  private readonly TAGGING_RESULTS_KEY = 'sphyr-tagging-results';
  private readonly MAX_TAGS = 50;
  private readonly MAX_TAGGING_RESULTS = 1000;

  public static getInstance(): ContentTagger {
    if (!ContentTagger.instance) {
      ContentTagger.instance = new ContentTagger();
    }
    return ContentTagger.instance;
  }

  // Main tagging method
  public async tagContent(
    document: SearchResult,
    options: TaggingOptions,
    _userId: string
  ): Promise<TaggingResult> {
    const startTime = Date.now();
    
    try {
      // Check for existing tagging result
      const existing = this.getExistingTaggingResult(document.id, options);
      if (existing) {
        return existing;
      }

      // Generate tags
      const tags = await this.generateTags(document, options);
      
      // Create tagging result
      const result: TaggingResult = {
        documentId: document.id,
        tags,
        confidence: this.calculateOverallConfidence(tags),
        processingTime: Date.now() - startTime,
        createdAt: new Date(),
        metadata: {
          originalWordCount: document.content.split(' ').length,
          tagDensity: tags.length / document.content.split(' ').length,
          categoryDistribution: this.getCategoryDistribution(tags)
        }
      };
      
      // Save result
      this.saveTaggingResult(result);
      
      return result;
    } catch (error) {
      logger.error('Content tagging failed', error as Error, {
        operation: 'tagContent',
        documentId: document.id
      });
      throw new Error(`Failed to tag content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate tags using AI-like logic
  private async generateTags(document: SearchResult, options: TaggingOptions): Promise<ContentTag[]> {
    const tags: ContentTag[] = [];
    const content = document.content.toLowerCase();
    
    // Topic tags
    if (options.includeTopics) {
      const topicTags = this.extractTopicTags(content, options);
      tags.push(...topicTags);
    }
    
    // Sentiment tags
    if (options.includeSentiment) {
      const sentimentTags = this.extractSentimentTags(content);
      tags.push(...sentimentTags);
    }
    
    // Entity tags
    if (options.includeEntities) {
      const entityTags = this.extractEntityTags(content, document);
      tags.push(...entityTags);
    }
    
    // Action tags
    if (options.includeActions) {
      const actionTags = this.extractActionTags(content);
      tags.push(...actionTags);
    }
    
    // Custom tags based on domain
    if (options.includeCustomTags) {
      const customTags = this.extractCustomTags(content, options.domain);
      tags.push(...customTags);
    }
    
    // Filter and sort tags
    return this.filterAndSortTags(tags, options);
  }

  // Extract topic tags
  private extractTopicTags(content: string, options: TaggingOptions): ContentTag[] {
    const tags: ContentTag[] = [];
    
    // Business topics
    const businessTopics = {
      'budget': { confidence: 0.9, synonyms: ['financial', 'cost', 'expense', 'revenue'] },
      'project': { confidence: 0.8, synonyms: ['initiative', 'task', 'assignment', 'work'] },
      'meeting': { confidence: 0.8, synonyms: ['conference', 'discussion', 'session', 'call'] },
      'contract': { confidence: 0.9, synonyms: ['agreement', 'deal', 'arrangement', 'terms'] },
      'report': { confidence: 0.7, synonyms: ['document', 'summary', 'analysis', 'review'] },
      'timeline': { confidence: 0.8, synonyms: ['schedule', 'deadline', 'milestone', 'delivery'] },
      'client': { confidence: 0.8, synonyms: ['customer', 'buyer', 'patron', 'stakeholder'] },
      'vendor': { confidence: 0.8, synonyms: ['supplier', 'provider', 'contractor', 'partner'] },
      'invoice': { confidence: 0.9, synonyms: ['bill', 'statement', 'charge', 'payment'] },
      'proposal': { confidence: 0.8, synonyms: ['suggestion', 'plan', 'recommendation', 'offer'] }
    };
    
    Object.entries(businessTopics).forEach(([topic, config]) => {
      if (content.includes(topic) || config.synonyms.some(syn => content.includes(syn))) {
        tags.push({
          id: this.generateId(),
          name: topic,
          category: 'topic',
          confidence: config.confidence,
          source: 'ai',
          metadata: {
            description: `Business topic: ${topic}`,
            synonyms: config.synonyms
          }
        });
      }
    });
    
    // Technical topics
    if (options.domain === 'technical') {
      const technicalTopics = {
        'api': { confidence: 0.9, synonyms: ['interface', 'endpoint', 'service'] },
        'database': { confidence: 0.9, synonyms: ['db', 'data', 'storage', 'sql'] },
        'security': { confidence: 0.8, synonyms: ['auth', 'permission', 'access', 'encryption'] },
        'performance': { confidence: 0.8, synonyms: ['speed', 'optimization', 'efficiency'] },
        'deployment': { confidence: 0.9, synonyms: ['release', 'publish', 'launch', 'rollout'] }
      };
      
      Object.entries(technicalTopics).forEach(([topic, config]) => {
        if (content.includes(topic) || config.synonyms.some(syn => content.includes(syn))) {
          tags.push({
            id: this.generateId(),
            name: topic,
            category: 'topic',
            confidence: config.confidence,
            source: 'ai',
            metadata: {
              description: `Technical topic: ${topic}`,
              synonyms: config.synonyms
            }
          });
        }
      });
    }
    
    return tags;
  }

  // Extract sentiment tags
  private extractSentimentTags(content: string): ContentTag[] {
    const tags: ContentTag[] = [];
    
    // Positive sentiment
    const positiveWords = ['excellent', 'great', 'good', 'successful', 'positive', 'improved', 'increased', 'achieved', 'completed', 'satisfied'];
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    
    if (positiveCount > 0) {
      tags.push({
        id: this.generateId(),
        name: 'positive',
        category: 'sentiment',
        confidence: Math.min(0.9, 0.5 + (positiveCount * 0.1)),
        source: 'ai',
        metadata: {
          description: 'Positive sentiment detected',
          color: '#10b981'
        }
      });
    }
    
    // Negative sentiment
    const negativeWords = ['poor', 'bad', 'failed', 'negative', 'decreased', 'problem', 'issue', 'concern', 'risk', 'urgent'];
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    
    if (negativeCount > 0) {
      tags.push({
        id: this.generateId(),
        name: 'negative',
        category: 'sentiment',
        confidence: Math.min(0.9, 0.5 + (negativeCount * 0.1)),
        source: 'ai',
        metadata: {
          description: 'Negative sentiment detected',
          color: '#ef4444'
        }
      });
    }
    
    // Neutral sentiment
    if (positiveCount === 0 && negativeCount === 0) {
      tags.push({
        id: this.generateId(),
        name: 'neutral',
        category: 'sentiment',
        confidence: 0.7,
        source: 'ai',
        metadata: {
          description: 'Neutral sentiment detected',
          color: '#6b7280'
        }
      });
    }
    
    return tags;
  }

  // Extract entity tags
  private extractEntityTags(content: string, document: SearchResult): ContentTag[] {
    const tags: ContentTag[] = [];
    
    // Extract author
    if (document.author) {
      tags.push({
        id: this.generateId(),
        name: document.author,
        category: 'entity',
        confidence: 0.9,
        source: 'ai',
        metadata: {
          description: 'Document author',
          icon: '👤'
        }
      });
    }
    
    // Extract source
    if (document.source) {
      tags.push({
        id: this.generateId(),
        name: document.source,
        category: 'entity',
        confidence: 0.9,
        source: 'ai',
        metadata: {
          description: 'Document source',
          icon: '🔗'
        }
      });
    }
    
    // Extract dates
    const datePattern = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi;
    const dates = content.match(datePattern);
    if (dates) {
      dates.forEach(date => {
        tags.push({
          id: this.generateId(),
          name: date,
          category: 'entity',
          confidence: 0.8,
          source: 'ai',
          metadata: {
            description: 'Date mentioned in document',
            icon: '📅'
          }
        });
      });
    }
    
    // Extract monetary values
    const moneyPattern = /\$[\d,]+(?:\.\d{2})?/g;
    const moneyValues = content.match(moneyPattern);
    if (moneyValues) {
      moneyValues.forEach(money => {
        tags.push({
          id: this.generateId(),
          name: money,
          category: 'entity',
          confidence: 0.8,
          source: 'ai',
          metadata: {
            description: 'Monetary value',
            icon: '💰'
          }
        });
      });
    }
    
    return tags;
  }

  // Extract action tags
  private extractActionTags(content: string): ContentTag[] {
    const tags: ContentTag[] = [];
    
    const actionWords = {
      'review': { confidence: 0.8, synonyms: ['examine', 'check', 'assess'] },
      'approve': { confidence: 0.9, synonyms: ['accept', 'authorize', 'confirm'] },
      'complete': { confidence: 0.8, synonyms: ['finish', 'finalize', 'conclude'] },
      'schedule': { confidence: 0.8, synonyms: ['plan', 'arrange', 'organize'] },
      'submit': { confidence: 0.9, synonyms: ['send', 'deliver', 'provide'] },
      'update': { confidence: 0.7, synonyms: ['modify', 'change', 'revise'] },
      'create': { confidence: 0.8, synonyms: ['generate', 'produce', 'develop'] },
      'delete': { confidence: 0.9, synonyms: ['remove', 'eliminate', 'cancel'] }
    };
    
    Object.entries(actionWords).forEach(([action, config]) => {
      if (content.includes(action) || config.synonyms.some(syn => content.includes(syn))) {
        tags.push({
          id: this.generateId(),
          name: action,
          category: 'action',
          confidence: config.confidence,
          source: 'ai',
          metadata: {
            description: `Action: ${action}`,
            synonyms: config.synonyms,
            icon: '⚡'
          }
        });
      }
    });
    
    return tags;
  }

  // Extract custom tags based on domain
  private extractCustomTags(content: string, domain: string): ContentTag[] {
    const tags: ContentTag[] = [];
    
    switch (domain) {
      case 'financial':
        const financialTerms = ['revenue', 'profit', 'loss', 'investment', 'budget', 'expense', 'income', 'tax', 'audit', 'compliance'];
        financialTerms.forEach(term => {
          if (content.includes(term)) {
            tags.push({
              id: this.generateId(),
              name: term,
              category: 'custom',
              confidence: 0.8,
              source: 'ai',
              metadata: {
                description: `Financial term: ${term}`,
                icon: '💼'
              }
            });
          }
        });
        break;
        
      case 'legal':
        const legalTerms = ['contract', 'agreement', 'liability', 'compliance', 'regulation', 'law', 'legal', 'terms', 'conditions', 'clause'];
        legalTerms.forEach(term => {
          if (content.includes(term)) {
            tags.push({
              id: this.generateId(),
              name: term,
              category: 'custom',
              confidence: 0.8,
              source: 'ai',
              metadata: {
                description: `Legal term: ${term}`,
                icon: '⚖️'
              }
            });
          }
        });
        break;
        
      case 'technical':
        const technicalTerms = ['api', 'database', 'server', 'client', 'frontend', 'backend', 'deployment', 'testing', 'debugging', 'optimization'];
        technicalTerms.forEach(term => {
          if (content.includes(term)) {
            tags.push({
              id: this.generateId(),
              name: term,
              category: 'custom',
              confidence: 0.8,
              source: 'ai',
              metadata: {
                description: `Technical term: ${term}`,
                icon: '💻'
              }
            });
          }
        });
        break;
    }
    
    return tags;
  }

  // Filter and sort tags
  private filterAndSortTags(tags: ContentTag[], options: TaggingOptions): ContentTag[] {
    // Remove duplicates
    const uniqueTags = tags.filter((tag, index, arr) => 
      arr.findIndex(other => other.name === tag.name && other.category === tag.category) === index
    );
    
    // Filter by confidence
    const filteredTags = uniqueTags.filter(tag => tag.confidence >= options.minConfidence);
    
    // Sort by confidence and limit
    return filteredTags
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, options.maxTags);
  }

  // Calculate overall confidence
  private calculateOverallConfidence(tags: ContentTag[]): number {
    if (tags.length === 0) return 0;
    
    const totalConfidence = tags.reduce((sum, tag) => sum + tag.confidence, 0);
    return totalConfidence / tags.length;
  }

  // Get category distribution
  private getCategoryDistribution(tags: ContentTag[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    tags.forEach(tag => {
      distribution[tag.category] = (distribution[tag.category] || 0) + 1;
    });
    return distribution;
  }

  // Get existing tagging result
  private getExistingTaggingResult(documentId: string, options: TaggingOptions): TaggingResult | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const results = this.getTaggingResults();
      const existing = results.find(r => r.documentId === documentId);
      return existing || null;
    } catch (error) {
      logger.error('Failed to get existing tagging result', error as Error, {
        operation: 'getExistingTaggingResult',
        documentId: documentId
      });
      return null;
    }
  }

  // Save tagging result
  private saveTaggingResult(result: TaggingResult): void {
    try {
      const results = this.getTaggingResults();
      const updated = [result, ...results.filter(r => r.documentId !== result.documentId)]
        .slice(0, this.MAX_TAGGING_RESULTS);
      
      const success = LocalStorageManager.setItem(
        'content_tagging_results',
        updated,
        { ttl: 7 * 24 * 60 * 60 * 1000 } // 7 days
      );

      if (!success) {
        logger.warn('Failed to save tagging result to localStorage', {
          operation: 'saveTaggingResult',
          documentId: result.documentId,
          resultsCount: updated.length
        });
      }
    } catch (error) {
      logger.error('Failed to save tagging result', error as Error, {
        operation: 'saveTaggingResult',
        documentId: result.documentId
      });
    }
  }

  // Get all tagging results
  public getTaggingResults(): TaggingResult[] {
    try {
      const results = LocalStorageManager.getItem<TaggingResult[]>('content_tagging_results');
      if (!results) return [];
      
      return results.map((r: TaggingResult) => ({
        ...r,
        createdAt: new Date(r.createdAt)
      }));
    } catch (error) {
      logger.error('Failed to load tagging results', error as Error, {
        operation: 'getTaggingResults'
      });
      return [];
    }
  }

  // Get tags by document ID
  public getTagsByDocumentId(documentId: string): ContentTag[] {
    const result = this.getTaggingResults().find(r => r.documentId === documentId);
    return result ? result.tags : [];
  }

  // Get all unique tags
  public getAllTags(): ContentTag[] {
    const results = this.getTaggingResults();
    const allTags: ContentTag[] = [];
    
    results.forEach(result => {
      allTags.push(...result.tags);
    });
    
    // Remove duplicates
    const uniqueTags = allTags.filter((tag, index, arr) => 
      arr.findIndex(other => other.id === tag.id) === index
    );
    
    return uniqueTags.sort((a, b) => b.confidence - a.confidence);
  }

  // Get tags by category
  public getTagsByCategory(category: string): ContentTag[] {
    return this.getAllTags().filter(tag => tag.category === category);
  }

  // Delete tagging result
  public deleteTaggingResult(documentId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const results = this.getTaggingResults();
      const updated = results.filter(r => r.documentId !== documentId);
      localStorage.setItem(this.TAGGING_RESULTS_KEY, JSON.stringify(updated));
    } catch (error) {
      logger.error('Failed to delete tagging result', error as Error, {
        operation: 'deleteTaggingResult',
        documentId: documentId
      });
    }
  }

  // Clear all tagging results
  public clearTaggingResults(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TAGGING_RESULTS_KEY);
  }

  // Export tagging results
  public exportTaggingResults(): TaggingResult[] {
    return this.getTaggingResults();
  }

  // Import tagging results
  public importTaggingResults(results: TaggingResult[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      const existing = this.getTaggingResults();
      const combined = [...results, ...existing]
        .filter((r, index, arr) => arr.findIndex(other => other.documentId === r.documentId) === index)
        .slice(0, this.MAX_TAGGING_RESULTS);
      
      localStorage.setItem(this.TAGGING_RESULTS_KEY, JSON.stringify(combined));
    } catch (error) {
      logger.error('Failed to import tagging results', error as Error, {
        operation: 'importTaggingResults',
        resultsCount: results.length
      });
    }
  }

  // Utility methods
  private generateId(): string {
    return `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get tagging statistics
  public getStatistics(): {
    totalDocuments: number;
    totalTags: number;
    averageTagsPerDocument: number;
    categoryDistribution: Record<string, number>;
    averageConfidence: number;
    mostCommonTags: Array<{ name: string; count: number; confidence: number }>;
  } {
    const results = this.getTaggingResults();
    const allTags = this.getAllTags();
    
    if (results.length === 0) {
      return {
        totalDocuments: 0,
        totalTags: 0,
        averageTagsPerDocument: 0,
        categoryDistribution: {},
        averageConfidence: 0,
        mostCommonTags: []
      };
    }
    
    const totalTags = allTags.length;
    const averageTagsPerDocument = totalTags / results.length;
    const averageConfidence = allTags.reduce((sum, tag) => sum + tag.confidence, 0) / totalTags;
    
    const categoryDistribution: Record<string, number> = {};
    allTags.forEach(tag => {
      categoryDistribution[tag.category] = (categoryDistribution[tag.category] || 0) + 1;
    });
    
    const tagCounts: Record<string, { count: number; confidence: number }> = {};
    allTags.forEach(tag => {
      if (!tagCounts[tag.name]) {
        tagCounts[tag.name] = { count: 0, confidence: 0 };
      }
      tagCounts[tag.name].count++;
      tagCounts[tag.name].confidence += tag.confidence;
    });
    
    const mostCommonTags = Object.entries(tagCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        confidence: data.confidence / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalDocuments: results.length,
      totalTags,
      averageTagsPerDocument,
      categoryDistribution,
      averageConfidence,
      mostCommonTags
    };
  }
}

export const contentTagger = ContentTagger.getInstance();
