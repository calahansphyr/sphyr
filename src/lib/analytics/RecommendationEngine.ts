import { UserProfile, UserEvent } from './UserBehaviorTracker';

export interface Recommendation {
  id: string;
  type: 'integration' | 'search_suggestion' | 'filter' | 'action' | 'content';
  title: string;
  description: string;
  confidence: number; // 0-1
  reason: string;
  metadata: Record<string, unknown>;
  expiresAt?: number;
}

export interface RecommendationContext {
  currentPage: string;
  userProfile: UserProfile;
  recentEvents: UserEvent[];
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  sessionDuration: number;
}

class RecommendationEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private globalPatterns: Map<string, number> = new Map();

  constructor() {
    this.initializeGlobalPatterns();
  }

  private initializeGlobalPatterns(): void {
    // Initialize with common patterns
    this.globalPatterns.set('gmail_after_slack', 0.8);
    this.globalPatterns.set('drive_after_docs', 0.9);
    this.globalPatterns.set('calendar_after_meetings', 0.7);
    this.globalPatterns.set('budget_queries', 0.6);
    this.globalPatterns.set('project_management', 0.7);
  }

  public generateRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Integration recommendations
    recommendations.push(...this.generateIntegrationRecommendations(context));

    // Search suggestions
    recommendations.push(...this.generateSearchSuggestions(context));

    // Filter recommendations
    recommendations.push(...this.generateFilterRecommendations(context));

    // Action recommendations
    recommendations.push(...this.generateActionRecommendations(context));

    // Sort by confidence and return top recommendations
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  private generateIntegrationRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { recentEvents } = context;

    // Analyze recent integration usage
    const recentIntegrations = this.getRecentIntegrations(recentEvents);
    const unusedIntegrations = this.getUnusedIntegrations(context.userProfile, recentIntegrations);

    // Recommend integrations based on patterns
    for (const integration of unusedIntegrations) {
      const confidence = this.calculateIntegrationConfidence(integration, context);
      
      if (confidence > 0.3) {
        recommendations.push({
          id: `integration_${integration}`,
          type: 'integration',
          title: `Connect ${this.getIntegrationDisplayName(integration)}`,
          description: this.getIntegrationDescription(integration),
          confidence,
          reason: this.getIntegrationReason(integration, context),
          metadata: {
            integration,
            action: 'connect'
          }
        });
      }
    }

    return recommendations;
  }

  private generateSearchSuggestions(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { recentEvents, timeOfDay } = context;

    // Get recent search patterns
    const recentSearches = this.getRecentSearches(recentEvents);
    const searchPatterns = this.analyzeSearchPatterns(recentSearches);

    // Time-based suggestions
    const timeBasedSuggestions = this.getTimeBasedSuggestions(timeOfDay);
    
    // Pattern-based suggestions
    const patternBasedSuggestions = this.getPatternBasedSuggestions(searchPatterns);

    // Combine and create recommendations
    const allSuggestions = [...timeBasedSuggestions, ...patternBasedSuggestions];
    
    for (const suggestion of allSuggestions) {
      const confidence = this.calculateSearchConfidence(suggestion, context);
      
      if (confidence > 0.4) {
        recommendations.push({
          id: `search_${suggestion}`,
          type: 'search_suggestion',
          title: suggestion,
          description: `Try searching for "${suggestion}"`,
          confidence,
          reason: this.getSearchReason(suggestion, context),
          metadata: {
            query: suggestion,
            type: 'suggestion'
          }
        });
      }
    }

    return recommendations;
  }

  private generateFilterRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { recentEvents } = context;

    // Analyze filter usage patterns
    const filterPatterns = this.analyzeFilterPatterns(recentEvents);
    
    // Recommend filters based on user behavior
    for (const [filter, usage] of filterPatterns) {
      if (usage > 0.5) {
        recommendations.push({
          id: `filter_${filter}`,
          type: 'filter',
          title: `Apply ${filter} filter`,
          description: `You frequently use the ${filter} filter`,
          confidence: usage,
          reason: `Based on your usage patterns`,
          metadata: {
            filter,
            action: 'apply'
          }
        });
      }
    }

    return recommendations;
  }

  private generateActionRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { recentEvents } = context;

    // Recommend actions based on user behavior
    if (this.shouldRecommendExport(recentEvents)) {
      recommendations.push({
        id: 'action_export',
        type: 'action',
        title: 'Export search results',
        description: 'Export your recent search results for offline use',
        confidence: 0.7,
        reason: 'You frequently search for similar content',
        metadata: {
          action: 'export',
          type: 'search_results'
        }
      });
    }

    if (this.shouldRecommendSchedule(recentEvents)) {
      recommendations.push({
        id: 'action_schedule',
        type: 'action',
        title: 'Schedule regular search',
        description: 'Set up automated searches for your frequently used queries',
        confidence: 0.6,
        reason: 'You search for this content regularly',
        metadata: {
          action: 'schedule',
          type: 'automated_search'
        }
      });
    }

    return recommendations;
  }

  private getRecentIntegrations(events: UserEvent[]): string[] {
    return events
      .filter(event => event.type === 'integration_connect')
      .map(event => event.properties.integration as string)
      .filter(Boolean)
      .slice(-10);
  }

  private getUnusedIntegrations(userProfile: UserProfile, recentIntegrations: string[]): string[] {
    const allIntegrations = [
      'google_gmail', 'google_drive', 'google_calendar', 'google_docs',
      'slack', 'microsoft_outlook', 'microsoft_teams', 'asana',
      'trello', 'notion', 'quickbooks', 'hubspot'
    ];

    return allIntegrations.filter(integration => 
      !userProfile.behavior.frequentlyUsedIntegrations.includes(integration) &&
      !recentIntegrations.includes(integration)
    );
  }

  private calculateIntegrationConfidence(integration: string, context: RecommendationContext): number {
    const { userProfile, recentEvents } = context;
    let confidence = 0.1; // Base confidence

    // Check global patterns
    const patternKey = `${integration}_pattern`;
    if (this.globalPatterns.has(patternKey)) {
      confidence += this.globalPatterns.get(patternKey)! * 0.3;
    }

    // Check user's integration usage patterns
    const similarIntegrations = this.getSimilarIntegrations(integration);
    for (const similar of similarIntegrations) {
      if (userProfile.behavior.frequentlyUsedIntegrations.includes(similar)) {
        confidence += 0.2;
      }
    }

    // Check recent activity patterns
    const recentIntegrations = this.getRecentIntegrations(recentEvents);
    if (recentIntegrations.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private getSimilarIntegrations(integration: string): string[] {
    const similarityMap: Record<string, string[]> = {
      'google_gmail': ['microsoft_outlook', 'slack'],
      'google_drive': ['microsoft_onedrive', 'dropbox'],
      'google_calendar': ['microsoft_calendar', 'apple_calendar'],
      'slack': ['microsoft_teams', 'discord'],
      'asana': ['trello', 'notion', 'monday'],
      'quickbooks': ['xero', 'freshbooks']
    };

    return similarityMap[integration] || [];
  }

  private getRecentSearches(events: UserEvent[]): string[] {
    return events
      .filter(event => event.type === 'search')
      .map(event => event.properties.query as string)
      .filter(Boolean)
      .slice(-20);
  }

  private analyzeSearchPatterns(searches: string[]): Map<string, number> {
    const patterns = new Map<string, number>();
    
    // Analyze common keywords
    const keywords = searches.flatMap(search => 
      search.toLowerCase().split(/\s+/).filter(word => word.length > 3)
    );
    
    for (const keyword of keywords) {
      patterns.set(keyword, (patterns.get(keyword) || 0) + 1);
    }

    // Normalize frequencies
    const maxFreq = Math.max(...patterns.values());
    for (const [keyword, freq] of patterns) {
      patterns.set(keyword, freq / maxFreq);
    }

    return patterns;
  }

  private getTimeBasedSuggestions(timeOfDay: number): string[] {
    const suggestions: Record<string, string[]> = {
      morning: ['daily standup notes', 'project updates', 'budget reports'],
      afternoon: ['client meetings', 'progress reports', 'team updates'],
      evening: ['tomorrow agenda', 'weekly summary', 'next week planning']
    };

    if (timeOfDay < 12) return suggestions.morning;
    if (timeOfDay < 17) return suggestions.afternoon;
    return suggestions.evening;
  }

  private getPatternBasedSuggestions(patterns: Map<string, number>): string[] {
    const suggestions: string[] = [];
    
    for (const [keyword, frequency] of patterns) {
      if (frequency > 0.3) {
        suggestions.push(keyword);
      }
    }

    return suggestions.slice(0, 5);
  }

  private calculateSearchConfidence(suggestion: string, context: RecommendationContext): number {
    const { recentEvents } = context;
    let confidence = 0.2; // Base confidence

    // Check if user has searched for similar terms
    const recentSearches = this.getRecentSearches(recentEvents);
    const similarity = this.calculateStringSimilarity(suggestion, recentSearches);
    confidence += similarity * 0.4;

    // Check user's search history
    if (context.userProfile.behavior.searchPatterns.includes(suggestion)) {
      confidence += 0.3;
    }

    return Math.min(confidence, 1.0);
  }

  private calculateStringSimilarity(str1: string, strings: string[]): number {
    if (strings.length === 0) return 0;
    
    const similarities = strings.map(str2 => {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      
      if (longer.length === 0) return 1.0;
      
      const editDistance = this.levenshteinDistance(longer, shorter);
      return (longer.length - editDistance) / longer.length;
    });

    return Math.max(...similarities);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private analyzeFilterPatterns(events: UserEvent[]): Map<string, number> {
    const patterns = new Map<string, number>();
    
    for (const event of events) {
      if (event.type === 'search' && event.properties.filters) {
        const filters = event.properties.filters as Record<string, unknown>;
        for (const [filter, value] of Object.entries(filters)) {
          if (value) {
            patterns.set(filter, (patterns.get(filter) || 0) + 1);
          }
        }
      }
    }

    // Normalize frequencies
    const maxFreq = Math.max(...patterns.values(), 1);
    for (const [filter, freq] of patterns) {
      patterns.set(filter, freq / maxFreq);
    }

    return patterns;
  }

  private shouldRecommendExport(events: UserEvent[]): boolean {
    const recentSearches = events
      .filter(event => event.type === 'search')
      .slice(-5);
    
    return recentSearches.length >= 3;
  }

  private shouldRecommendSchedule(events: UserEvent[]): boolean {
    const searchPatterns = this.analyzeSearchPatterns(this.getRecentSearches(events));
    const frequentPatterns = Array.from(searchPatterns.entries())
      .filter(([, freq]) => freq > 0.5);
    
    return frequentPatterns.length > 0;
  }

  private getIntegrationDisplayName(integration: string): string {
    const names: Record<string, string> = {
      'google_gmail': 'Gmail',
      'google_drive': 'Google Drive',
      'google_calendar': 'Google Calendar',
      'google_docs': 'Google Docs',
      'slack': 'Slack',
      'microsoft_outlook': 'Outlook',
      'microsoft_teams': 'Microsoft Teams',
      'asana': 'Asana',
      'trello': 'Trello',
      'notion': 'Notion',
      'quickbooks': 'QuickBooks',
      'hubspot': 'HubSpot'
    };

    return names[integration] || integration;
  }

  private getIntegrationDescription(integration: string): string {
    const descriptions: Record<string, string> = {
      'google_gmail': 'Connect Gmail to search through your emails',
      'google_drive': 'Connect Google Drive to search your documents',
      'google_calendar': 'Connect Google Calendar to search your events',
      'slack': 'Connect Slack to search your team conversations',
      'microsoft_outlook': 'Connect Outlook to search your emails',
      'asana': 'Connect Asana to search your project tasks',
      'quickbooks': 'Connect QuickBooks to search your financial data'
    };

    return descriptions[integration] || `Connect ${integration} to expand your search capabilities`;
  }

  private getIntegrationReason(integration: string, context: RecommendationContext): string {
    
    if (context.userProfile.behavior.frequentlyUsedIntegrations.length === 0) {
      return 'Get started by connecting your first integration';
    }
    
    const similarIntegrations = this.getSimilarIntegrations(integration);
    const hasSimilar = similarIntegrations.some(similar => 
      context.userProfile.behavior.frequentlyUsedIntegrations.includes(similar)
    );
    
    if (hasSimilar) {
      return 'You use similar integrations, this might be useful too';
    }
    
    return 'Expand your search capabilities with this integration';
  }

  private getSearchReason(suggestion: string, context: RecommendationContext): string {
    
    if (context.userProfile.behavior.searchPatterns.includes(suggestion)) {
      return 'You\'ve searched for this before';
    }
    
    const recentSearches = this.getRecentSearches(context.recentEvents);
    const similarity = this.calculateStringSimilarity(suggestion, recentSearches);
    
    if (similarity > 0.5) {
      return 'Similar to your recent searches';
    }
    
    return 'Popular search suggestion';
  }

  public updateUserProfile(userId: string, profile: UserProfile): void {
    this.userProfiles.set(userId, profile);
  }

  public getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }
}

// Singleton instance
export const recommendationEngine = new RecommendationEngine();

export default recommendationEngine;
