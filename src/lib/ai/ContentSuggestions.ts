import { SearchResult } from '@/types/integrations';
import { ContentTag } from './ContentTagger';
import { logger } from '@/lib/logger';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';

export interface ContentSuggestion {
  id: string;
  type: 'related_document' | 'similar_content' | 'trending_topic' | 'recommended_action' | 'follow_up' | 'template' | 'resource';
  title: string;
  description: string;
  confidence: number;
  relevance: number;
  metadata: {
    source?: string;
    category?: string;
    tags?: string[];
    actionUrl?: string;
    estimatedTime?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    priority?: 'low' | 'medium' | 'high';
    icon?: string;
    color?: string;
  };
  createdAt: Date;
}

export interface SuggestionContext {
  currentDocument: SearchResult;
  userHistory: SearchResult[];
  userTags: ContentTag[];
  userPreferences: {
    preferredSources: string[];
    interestedTopics: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    timeAvailability: 'limited' | 'moderate' | 'extensive';
  };
  organizationContext: {
    department: string;
    role: string;
    currentProjects: string[];
    teamSize: number;
  };
}

export interface SuggestionOptions {
  maxSuggestions: number;
  includeTypes: ContentSuggestion['type'][];
  minConfidence: number;
  minRelevance: number;
  timeHorizon: 'immediate' | 'short_term' | 'long_term';
  focusArea: 'learning' | 'productivity' | 'collaboration' | 'analysis' | 'all';
}

class ContentSuggestions {
  private static instance: ContentSuggestions;
  private readonly STORAGE_KEY = 'sphyr-content-suggestions';
  private readonly MAX_SUGGESTIONS = 1000;
  private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

  public static getInstance(): ContentSuggestions {
    if (!ContentSuggestions.instance) {
      ContentSuggestions.instance = new ContentSuggestions();
    }
    return ContentSuggestions.instance;
  }

  // Main suggestion generation method
  public async generateSuggestions(
    context: SuggestionContext,
    options: SuggestionOptions
  ): Promise<ContentSuggestion[]> {
    try {
      // Check for cached suggestions
      const cached = this.getCachedSuggestions(context.currentDocument.id, options);
      if (cached) {
        return cached;
      }

      // Generate new suggestions
      const suggestions = await this.generateNewSuggestions(context, options);
      
      // Cache suggestions
      this.cacheSuggestions(context.currentDocument.id, options, suggestions);
      
      return suggestions;
    } catch (error) {
      logger.error('Content suggestion generation failed', error as Error, {
        operation: 'generateSuggestions',
        contextId: context.currentDocument.id
      });
      throw new Error(`Failed to generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate new suggestions
  private async generateNewSuggestions(
    context: SuggestionContext,
    options: SuggestionOptions
  ): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];
    
    // Related documents
    if (options.includeTypes.includes('related_document')) {
      const relatedDocs = this.generateRelatedDocumentSuggestions(context, options);
      suggestions.push(...relatedDocs);
    }
    
    // Similar content
    if (options.includeTypes.includes('similar_content')) {
      const similarContent = this.generateSimilarContentSuggestions(context, options);
      suggestions.push(...similarContent);
    }
    
    // Trending topics
    if (options.includeTypes.includes('trending_topic')) {
      const trendingTopics = this.generateTrendingTopicSuggestions(context, options);
      suggestions.push(...trendingTopics);
    }
    
    // Recommended actions
    if (options.includeTypes.includes('recommended_action')) {
      const actions = this.generateActionSuggestions(context, options);
      suggestions.push(...actions);
    }
    
    // Follow-up suggestions
    if (options.includeTypes.includes('follow_up')) {
      const followUps = this.generateFollowUpSuggestions(context, options);
      suggestions.push(...followUps);
    }
    
    // Templates
    if (options.includeTypes.includes('template')) {
      const templates = this.generateTemplateSuggestions(context, options);
      suggestions.push(...templates);
    }
    
    // Resources
    if (options.includeTypes.includes('resource')) {
      const resources = this.generateResourceSuggestions(context, options);
      suggestions.push(...resources);
    }
    
    // Filter and rank suggestions
    return this.filterAndRankSuggestions(suggestions, options);
  }

  // Generate related document suggestions
  private generateRelatedDocumentSuggestions(
    context: SuggestionContext,
    options: SuggestionOptions
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const currentDoc = context.currentDocument;
    
    // Find documents with similar tags or topics
    const relatedDocs = context.userHistory.filter(doc => {
      if (doc.id === currentDoc.id) return false;
      
      // Check for similar tags
      const currentTags = this.extractTagsFromContent(currentDoc.content);
      const docTags = this.extractTagsFromContent(doc.content);
      const commonTags = currentTags.filter(tag => docTags.includes(tag));
      
      return commonTags.length > 0;
    });
    
    relatedDocs.slice(0, 3).forEach(doc => {
      const relevance = this.calculateDocumentRelevance(currentDoc, doc);
      if (relevance >= options.minRelevance) {
        suggestions.push({
          id: this.generateId(),
          type: 'related_document',
          title: `Related: ${doc.title}`,
          description: `Similar content to "${currentDoc.title}"`,
          confidence: 0.8,
          relevance,
          metadata: {
            source: doc.source,
            category: 'document',
            tags: this.extractTagsFromContent(doc.content),
            actionUrl: doc.url,
            estimatedTime: '5-10 min',
            difficulty: 'easy',
            priority: 'medium',
            icon: '📄',
            color: '#3b82f6'
          },
          createdAt: new Date()
        });
      }
    });
    
    return suggestions;
  }

  // Generate similar content suggestions
  private generateSimilarContentSuggestions(
    context: SuggestionContext,
    _options: SuggestionOptions
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const currentDoc = context.currentDocument;
    
    // Suggest content based on document type and topic
    const _contentType = this.determineContentType(currentDoc);
    const topic = this.extractMainTopic(currentDoc.content);
    
    const similarContentTemplates = {
      'budget': [
        {
          title: 'Budget Planning Template',
          description: 'Use this template for similar budget planning documents',
          actionUrl: '/templates/budget-planning',
          estimatedTime: '15-30 min',
          difficulty: 'medium' as const,
          priority: 'high' as const
        },
        {
          title: 'Financial Analysis Guide',
          description: 'Learn best practices for financial document analysis',
          actionUrl: '/guides/financial-analysis',
          estimatedTime: '20-40 min',
          difficulty: 'medium' as const,
          priority: 'medium' as const
        }
      ],
      'meeting': [
        {
          title: 'Meeting Notes Template',
          description: 'Standardized template for meeting documentation',
          actionUrl: '/templates/meeting-notes',
          estimatedTime: '10-15 min',
          difficulty: 'easy' as const,
          priority: 'high' as const
        },
        {
          title: 'Action Items Tracker',
          description: 'Track and manage action items from meetings',
          actionUrl: '/tools/action-tracker',
          estimatedTime: '5-10 min',
          difficulty: 'easy' as const,
          priority: 'medium' as const
        }
      ],
      'project': [
        {
          title: 'Project Charter Template',
          description: 'Create a comprehensive project charter',
          actionUrl: '/templates/project-charter',
          estimatedTime: '30-45 min',
          difficulty: 'medium' as const,
          priority: 'high' as const
        },
        {
          title: 'Risk Assessment Framework',
          description: 'Identify and assess project risks',
          actionUrl: '/frameworks/risk-assessment',
          estimatedTime: '20-30 min',
          difficulty: 'medium' as const,
          priority: 'medium' as const
        }
      ]
    };
    
    const templates = similarContentTemplates[topic as keyof typeof similarContentTemplates] || [];
    
    templates.forEach(template => {
      suggestions.push({
        id: this.generateId(),
        type: 'similar_content',
        title: template.title,
        description: template.description,
        confidence: 0.7,
        relevance: 0.8,
        metadata: {
          category: 'template',
          actionUrl: template.actionUrl,
          estimatedTime: template.estimatedTime,
          difficulty: template.difficulty,
          priority: template.priority,
          icon: '📋',
          color: '#10b981'
        },
        createdAt: new Date()
      });
    });
    
    return suggestions;
  }

  // Generate trending topic suggestions
  private generateTrendingTopicSuggestions(
    context: SuggestionContext,
    options: SuggestionOptions
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    
    // Analyze user's recent documents to find trending topics
    const recentTopics = this.extractTrendingTopics(context.userHistory);
    
    recentTopics.slice(0, 3).forEach(topic => {
      suggestions.push({
        id: this.generateId(),
        type: 'trending_topic',
        title: `Trending: ${topic.name}`,
        description: `Explore more content about ${topic.name}`,
        confidence: 0.6,
        relevance: topic.frequency / 10, // Normalize frequency
        metadata: {
          category: 'trending',
          tags: [topic.name],
          estimatedTime: '10-20 min',
          difficulty: 'easy',
          priority: 'low',
          icon: '📈',
          color: '#f59e0b'
        },
        createdAt: new Date()
      });
    });
    
    return suggestions;
  }

  // Generate action suggestions
  private generateActionSuggestions(
    context: SuggestionContext,
    options: SuggestionOptions
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const currentDoc = context.currentDocument;
    
    // Extract action items from document
    const actionItems = this.extractActionItems(currentDoc.content);
    
    actionItems.forEach((action, index) => {
      suggestions.push({
        id: this.generateId(),
        type: 'recommended_action',
        title: `Action: ${action}`,
        description: `Follow up on this action item from the document`,
        confidence: 0.9,
        relevance: 0.9,
        metadata: {
          category: 'action',
          estimatedTime: this.estimateActionTime(action),
          difficulty: this.assessActionDifficulty(action),
          priority: 'high',
          icon: '⚡',
          color: '#ef4444'
        },
        createdAt: new Date()
      });
    });
    
    // Suggest general actions based on document type
    const generalActions = this.getGeneralActions(currentDoc);
    suggestions.push(...generalActions);
    
    return suggestions;
  }

  // Generate follow-up suggestions
  private generateFollowUpSuggestions(
    context: SuggestionContext,
    options: SuggestionOptions
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const currentDoc = context.currentDocument;
    
    // Suggest follow-up activities based on document type
    const followUpActivities = {
      'budget': [
        {
          title: 'Schedule Budget Review',
          description: 'Set up a follow-up meeting to review budget progress',
          estimatedTime: '5 min',
          difficulty: 'easy' as const
        },
        {
          title: 'Create Budget Dashboard',
          description: 'Build a dashboard to track budget metrics',
          estimatedTime: '30-60 min',
          difficulty: 'medium' as const
        }
      ],
      'meeting': [
        {
          title: 'Send Meeting Summary',
          description: 'Share meeting notes with all participants',
          estimatedTime: '5-10 min',
          difficulty: 'easy' as const
        },
        {
          title: 'Schedule Follow-up Meeting',
          description: 'Plan the next meeting based on action items',
          estimatedTime: '5 min',
          difficulty: 'easy' as const
        }
      ],
      'project': [
        {
          title: 'Update Project Timeline',
          description: 'Revise project timeline based on new information',
          estimatedTime: '15-30 min',
          difficulty: 'medium' as const
        },
        {
          title: 'Notify Stakeholders',
          description: 'Share project updates with relevant stakeholders',
          estimatedTime: '10-15 min',
          difficulty: 'easy' as const
        }
      ]
    };
    
    const docType = this.determineContentType(currentDoc);
    const activities = followUpActivities[docType as keyof typeof followUpActivities] || [];
    
    activities.forEach(activity => {
      suggestions.push({
        id: this.generateId(),
        type: 'follow_up',
        title: activity.title,
        description: activity.description,
        confidence: 0.8,
        relevance: 0.8,
        metadata: {
          category: 'follow-up',
          estimatedTime: activity.estimatedTime,
          difficulty: activity.difficulty,
          priority: 'medium',
          icon: '🔄',
          color: '#8b5cf6'
        },
        createdAt: new Date()
      });
    });
    
    return suggestions;
  }

  // Generate template suggestions
  private generateTemplateSuggestions(
    context: SuggestionContext,
    options: SuggestionOptions
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const currentDoc = context.currentDocument;
    
    const templates = {
      'budget': [
        { name: 'Annual Budget Template', url: '/templates/annual-budget', category: 'financial' },
        { name: 'Project Budget Template', url: '/templates/project-budget', category: 'project' },
        { name: 'Expense Report Template', url: '/templates/expense-report', category: 'financial' }
      ],
      'meeting': [
        { name: 'Team Meeting Template', url: '/templates/team-meeting', category: 'collaboration' },
        { name: 'Client Meeting Template', url: '/templates/client-meeting', category: 'client' },
        { name: 'Board Meeting Template', url: '/templates/board-meeting', category: 'governance' }
      ],
      'project': [
        { name: 'Project Plan Template', url: '/templates/project-plan', category: 'project' },
        { name: 'Risk Assessment Template', url: '/templates/risk-assessment', category: 'risk' },
        { name: 'Status Report Template', url: '/templates/status-report', category: 'reporting' }
      ]
    };
    
    const docType = this.determineContentType(currentDoc);
    const docTemplates = templates[docType as keyof typeof templates] || [];
    
    docTemplates.forEach(template => {
      suggestions.push({
        id: this.generateId(),
        type: 'template',
        title: template.name,
        description: `Use this template for similar ${docType} documents`,
        confidence: 0.7,
        relevance: 0.8,
        metadata: {
          category: template.category,
          actionUrl: template.url,
          estimatedTime: '10-20 min',
          difficulty: 'easy',
          priority: 'medium',
          icon: '📝',
          color: '#06b6d4'
        },
        createdAt: new Date()
      });
    });
    
    return suggestions;
  }

  // Generate resource suggestions
  private generateResourceSuggestions(
    context: SuggestionContext,
    options: SuggestionOptions
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const currentDoc = context.currentDocument;
    
    const resources = {
      'budget': [
        { name: 'Financial Planning Guide', url: '/guides/financial-planning', type: 'guide' },
        { name: 'Budget Analysis Tools', url: '/tools/budget-analysis', type: 'tool' },
        { name: 'Financial Best Practices', url: '/resources/financial-best-practices', type: 'resource' }
      ],
      'meeting': [
        { name: 'Meeting Facilitation Guide', url: '/guides/meeting-facilitation', type: 'guide' },
        { name: 'Collaboration Tools', url: '/tools/collaboration', type: 'tool' },
        { name: 'Communication Best Practices', url: '/resources/communication-best-practices', type: 'resource' }
      ],
      'project': [
        { name: 'Project Management Guide', url: '/guides/project-management', type: 'guide' },
        { name: 'Project Tracking Tools', url: '/tools/project-tracking', type: 'tool' },
        { name: 'Agile Methodology Resources', url: '/resources/agile-methodology', type: 'resource' }
      ]
    };
    
    const docType = this.determineContentType(currentDoc);
    const docResources = resources[docType as keyof typeof resources] || [];
    
    docResources.forEach(resource => {
      suggestions.push({
        id: this.generateId(),
        type: 'resource',
        title: resource.name,
        description: `Learn more about ${docType} management`,
        confidence: 0.6,
        relevance: 0.7,
        metadata: {
          category: resource.type,
          actionUrl: resource.url,
          estimatedTime: '15-30 min',
          difficulty: 'medium',
          priority: 'low',
          icon: '📚',
          color: '#84cc16'
        },
        createdAt: new Date()
      });
    });
    
    return suggestions;
  }

  // Helper methods
  private extractTagsFromContent(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return words.filter(word => word.length > 3 && !commonWords.includes(word));
  }

  private calculateDocumentRelevance(doc1: SearchResult, doc2: SearchResult): number {
    const tags1 = this.extractTagsFromContent(doc1.content);
    const tags2 = this.extractTagsFromContent(doc2.content);
    const commonTags = tags1.filter(tag => tags2.includes(tag));
    return commonTags.length / Math.max(tags1.length, tags2.length);
  }

  private determineContentType(doc: SearchResult): string {
    const content = doc.content.toLowerCase();
    if (content.includes('budget') || content.includes('financial') || content.includes('cost')) return 'budget';
    if (content.includes('meeting') || content.includes('discussion') || content.includes('agenda')) return 'meeting';
    if (content.includes('project') || content.includes('task') || content.includes('milestone')) return 'project';
    if (content.includes('report') || content.includes('analysis') || content.includes('summary')) return 'report';
    return 'general';
  }

  private extractMainTopic(content: string): string {
    const topics = ['budget', 'meeting', 'project', 'report', 'contract', 'proposal', 'timeline'];
    const contentLower = content.toLowerCase();
    return topics.find(topic => contentLower.includes(topic)) || 'general';
  }

  private extractTrendingTopics(documents: SearchResult[]): Array<{ name: string; frequency: number }> {
    const topicCounts: Record<string, number> = {};
    
    documents.forEach(doc => {
      const topic = this.extractMainTopic(doc.content);
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    return Object.entries(topicCounts)
      .map(([name, frequency]) => ({ name, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  private extractActionItems(content: string): string[] {
    const actionPatterns = [
      /(?:action required|todo|task|deadline|due|complete|finish|implement|review|approve|submit|send|call|meet|schedule)/gi,
      /(?:must|should|need to|required to|expected to)/gi
    ];
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const actionItems: string[] = [];
    
    sentences.forEach(sentence => {
      actionPatterns.forEach(pattern => {
        if (pattern.test(sentence) && sentence.length < 200) {
          actionItems.push(sentence.trim());
        }
      });
    });
    
    return [...new Set(actionItems)].slice(0, 5);
  }

  private estimateActionTime(action: string): string {
    if (action.includes('review') || action.includes('check')) return '10-15 min';
    if (action.includes('schedule') || action.includes('plan')) return '5-10 min';
    if (action.includes('create') || action.includes('develop')) return '30-60 min';
    if (action.includes('implement') || action.includes('build')) return '1-2 hours';
    return '15-30 min';
  }

  private assessActionDifficulty(action: string): 'easy' | 'medium' | 'hard' {
    if (action.includes('review') || action.includes('check') || action.includes('schedule')) return 'easy';
    if (action.includes('create') || action.includes('develop') || action.includes('plan')) return 'medium';
    if (action.includes('implement') || action.includes('build') || action.includes('integrate')) return 'hard';
    return 'medium';
  }

  private getGeneralActions(doc: SearchResult): ContentSuggestion[] {
    const actions: ContentSuggestion[] = [];
    
    actions.push({
      id: this.generateId(),
      type: 'recommended_action',
      title: 'Share Document',
      description: 'Share this document with relevant team members',
      confidence: 0.8,
      relevance: 0.7,
      metadata: {
        category: 'collaboration',
        estimatedTime: '2-5 min',
        difficulty: 'easy',
        priority: 'medium',
        icon: '📤',
        color: '#3b82f6'
      },
      createdAt: new Date()
    });
    
    actions.push({
      id: this.generateId(),
      type: 'recommended_action',
      title: 'Add to Favorites',
      description: 'Save this document for quick access',
      confidence: 0.9,
      relevance: 0.6,
      metadata: {
        category: 'organization',
        estimatedTime: '1 min',
        difficulty: 'easy',
        priority: 'low',
        icon: '⭐',
        color: '#f59e0b'
      },
      createdAt: new Date()
    });
    
    return actions;
  }

  // Filter and rank suggestions
  private filterAndRankSuggestions(suggestions: ContentSuggestion[], options: SuggestionOptions): ContentSuggestion[] {
    // Filter by confidence and relevance
    const filtered = suggestions.filter(s => 
      s.confidence >= options.minConfidence && 
      s.relevance >= options.minRelevance
    );
    
    // Sort by relevance and confidence
    const sorted = filtered.sort((a, b) => {
      const scoreA = (a.relevance * 0.7) + (a.confidence * 0.3);
      const scoreB = (b.relevance * 0.7) + (b.confidence * 0.3);
      return scoreB - scoreA;
    });
    
    // Limit results
    return sorted.slice(0, options.maxSuggestions);
  }

  // Cache management
  private getCachedSuggestions(documentId: string, options: SuggestionOptions): ContentSuggestion[] | null {
    try {
      const key = this.getCacheKey(documentId, options);
      const cached = LocalStorageManager.getItem<{
        suggestions: ContentSuggestion[];
        timestamp: number;
      }>(`content_suggestions_${key}`);

      if (!cached) {
        return null;
      }

      return cached.suggestions.map((s: ContentSuggestion) => ({
        ...s,
        createdAt: new Date(s.createdAt)
      }));
    } catch (error) {
      logger.error('Failed to get cached suggestions', error as Error, {
        operation: 'getCachedSuggestions',
        documentId: documentId
      });
      return null;
    }
  }

  private cacheSuggestions(documentId: string, options: SuggestionOptions, suggestions: ContentSuggestion[]): void {
    try {
      const key = this.getCacheKey(documentId, options);
      const cacheData = {
        suggestions,
        timestamp: Date.now()
      };

      const success = LocalStorageManager.setItem(
        `content_suggestions_${key}`,
        cacheData,
        { ttl: 2 * 60 * 60 * 1000 } // 2 hours
      );

      if (!success) {
        logger.warn('Failed to cache suggestions to localStorage', {
          operation: 'cacheSuggestions',
          documentId: documentId,
          suggestionsCount: suggestions.length
        });
      }
    } catch (error) {
      logger.error('Failed to cache suggestions', error as Error, {
        operation: 'cacheSuggestions',
        documentId: documentId
      });
    }
  }

  private getCacheKey(documentId: string, options: SuggestionOptions): string {
    return `${documentId}_${JSON.stringify(options)}`;
  }

  // Utility methods
  private generateId(): string {
    return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear cache
  public clearCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Get cache statistics
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

export const contentSuggestions = ContentSuggestions.getInstance();
