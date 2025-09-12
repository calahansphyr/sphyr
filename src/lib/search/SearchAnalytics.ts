import { SearchResult } from '@/types/integrations';
import { SearchHistoryItem } from './SearchHistoryManager';

export interface SearchMetrics {
  query: string;
  timestamp: Date;
  resultCount: number;
  searchTime: number;
  filters: Record<string, any>;
  sort: string;
  source: string;
  userSatisfaction?: number; // 1-5 rating
  clickedResults: string[]; // IDs of clicked results
  exportedResults: string[]; // IDs of exported results
}

export interface SearchInsights {
  popularQueries: Array<{ query: string; count: number; avgResults: number }>;
  searchTrends: Array<{ date: string; searches: number; avgResults: number }>;
  topSources: Array<{ source: string; searches: number; avgResults: number }>;
  filterUsage: Array<{ filter: string; usage: number; effectiveness: number }>;
  userBehavior: {
    avgSearchTime: number;
    avgResultsPerSearch: number;
    clickThroughRate: number;
    exportRate: number;
    satisfactionScore: number;
  };
  recommendations: Array<{
    type: 'query' | 'filter' | 'source' | 'behavior';
    title: string;
    description: string;
    confidence: number;
    action?: string;
  }>;
}

export interface SearchPerformance {
  avgSearchTime: number;
  successRate: number;
  errorRate: number;
  cacheHitRate: number;
  apiResponseTime: number;
}

class SearchAnalytics {
  private static instance: SearchAnalytics;
  private readonly STORAGE_KEY = 'sphyr-search-analytics';
  private readonly METRICS_KEY = 'sphyr-search-metrics';
  private readonly MAX_METRICS = 1000;

  public static getInstance(): SearchAnalytics {
    if (!SearchAnalytics.instance) {
      SearchAnalytics.instance = new SearchAnalytics();
    }
    return SearchAnalytics.instance;
  }

  // Track Search Metrics
  public trackSearch(
    query: string,
    results: SearchResult[],
    searchTime: number,
    filters: Record<string, any> = {},
    sort: string = 'relevance',
    source: string = 'global'
  ): void {
    if (typeof window === 'undefined') return;

    try {
      const metrics = this.getSearchMetrics();
      const newMetric: SearchMetrics = {
        query: query.trim(),
        timestamp: new Date(),
        resultCount: results.length,
        searchTime,
        filters,
        sort,
        source,
        clickedResults: [],
        exportedResults: []
      };

      const updatedMetrics = [newMetric, ...metrics].slice(0, this.MAX_METRICS);
      localStorage.setItem(this.METRICS_KEY, JSON.stringify(updatedMetrics));
    } catch (error) {
      console.error('Failed to track search metrics:', error);
    }
  }

  public trackResultClick(resultId: string, query: string): void {
    if (typeof window === 'undefined') return;

    try {
      const metrics = this.getSearchMetrics();
      const recentMetric = metrics.find(m => 
        m.query === query && 
        (Date.now() - m.timestamp.getTime()) < 5 * 60 * 1000 // Within 5 minutes
      );

      if (recentMetric && !recentMetric.clickedResults.includes(resultId)) {
        recentMetric.clickedResults.push(resultId);
        this.updateMetrics(metrics);
      }
    } catch (error) {
      console.error('Failed to track result click:', error);
    }
  }

  public trackResultExport(resultId: string, query: string): void {
    if (typeof window === 'undefined') return;

    try {
      const metrics = this.getSearchMetrics();
      const recentMetric = metrics.find(m => 
        m.query === query && 
        (Date.now() - m.timestamp.getTime()) < 5 * 60 * 1000 // Within 5 minutes
      );

      if (recentMetric && !recentMetric.exportedResults.includes(resultId)) {
        recentMetric.exportedResults.push(resultId);
        this.updateMetrics(metrics);
      }
    } catch (error) {
      console.error('Failed to track result export:', error);
    }
  }

  public trackUserSatisfaction(query: string, rating: number): void {
    if (typeof window === 'undefined') return;

    try {
      const metrics = this.getSearchMetrics();
      const recentMetric = metrics.find(m => 
        m.query === query && 
        (Date.now() - m.timestamp.getTime()) < 5 * 60 * 1000 // Within 5 minutes
      );

      if (recentMetric) {
        recentMetric.userSatisfaction = rating;
        this.updateMetrics(metrics);
      }
    } catch (error) {
      console.error('Failed to track user satisfaction:', error);
    }
  }

  // Get Search Metrics
  public getSearchMetrics(): SearchMetrics[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.METRICS_KEY);
      if (!stored) return [];

      const metrics = JSON.parse(stored);
      return metrics.map((metric: any) => ({
        ...metric,
        timestamp: new Date(metric.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load search metrics:', error);
      return [];
    }
  }

  // Generate Search Insights
  public generateSearchInsights(): SearchInsights {
    const metrics = this.getSearchMetrics();
    const history = this.getSearchHistory();

    if (metrics.length === 0) {
      return this.getEmptyInsights();
    }

    return {
      popularQueries: this.getPopularQueries(metrics),
      searchTrends: this.getSearchTrends(metrics),
      topSources: this.getTopSources(metrics),
      filterUsage: this.getFilterUsage(metrics),
      userBehavior: this.getUserBehavior(metrics),
      recommendations: this.generateRecommendations(metrics, history)
    };
  }

  private getPopularQueries(metrics: SearchMetrics[]): Array<{ query: string; count: number; avgResults: number }> {
    const queryStats: Record<string, { count: number; totalResults: number }> = {};

    metrics.forEach(metric => {
      if (!queryStats[metric.query]) {
        queryStats[metric.query] = { count: 0, totalResults: 0 };
      }
      queryStats[metric.query].count++;
      queryStats[metric.query].totalResults += metric.resultCount;
    });

    return Object.entries(queryStats)
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgResults: Math.round(stats.totalResults / stats.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getSearchTrends(metrics: SearchMetrics[]): Array<{ date: string; searches: number; avgResults: number }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMetrics = metrics.filter(m => m.timestamp >= thirtyDaysAgo);
    const trendMap: Record<string, { searches: number; totalResults: number }> = {};

    recentMetrics.forEach(metric => {
      const date = metric.timestamp.toISOString().split('T')[0];
      if (!trendMap[date]) {
        trendMap[date] = { searches: 0, totalResults: 0 };
      }
      trendMap[date].searches++;
      trendMap[date].totalResults += metric.resultCount;
    });

    return Object.entries(trendMap)
      .map(([date, stats]) => ({
        date,
        searches: stats.searches,
        avgResults: Math.round(stats.totalResults / stats.searches)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getTopSources(metrics: SearchMetrics[]): Array<{ source: string; searches: number; avgResults: number }> {
    const sourceStats: Record<string, { searches: number; totalResults: number }> = {};

    metrics.forEach(metric => {
      if (!sourceStats[metric.source]) {
        sourceStats[metric.source] = { searches: 0, totalResults: 0 };
      }
      sourceStats[metric.source].searches++;
      sourceStats[metric.source].totalResults += metric.resultCount;
    });

    return Object.entries(sourceStats)
      .map(([source, stats]) => ({
        source,
        searches: stats.searches,
        avgResults: Math.round(stats.totalResults / stats.searches)
      }))
      .sort((a, b) => b.searches - a.searches)
      .slice(0, 10);
  }

  private getFilterUsage(metrics: SearchMetrics[]): Array<{ filter: string; usage: number; effectiveness: number }> {
    const filterStats: Record<string, { usage: number; totalResults: number; totalSearches: number }> = {};

    metrics.forEach(metric => {
      Object.keys(metric.filters).forEach(filter => {
        if (!filterStats[filter]) {
          filterStats[filter] = { usage: 0, totalResults: 0, totalSearches: 0 };
        }
        filterStats[filter].usage++;
        filterStats[filter].totalResults += metric.resultCount;
        filterStats[filter].totalSearches++;
      });
    });

    return Object.entries(filterStats)
      .map(([filter, stats]) => ({
        filter,
        usage: stats.usage,
        effectiveness: Math.round((stats.totalResults / stats.totalSearches) * 100) / 100
      }))
      .sort((a, b) => b.usage - a.usage);
  }

  private getUserBehavior(metrics: SearchMetrics[]): SearchInsights['userBehavior'] {
    const totalSearches = metrics.length;
    const totalResults = metrics.reduce((sum, m) => sum + m.resultCount, 0);
    const totalSearchTime = metrics.reduce((sum, m) => sum + m.searchTime, 0);
    const totalClicks = metrics.reduce((sum, m) => sum + m.clickedResults.length, 0);
    const totalExports = metrics.reduce((sum, m) => sum + m.exportedResults.length, 0);
    const satisfactionRatings = metrics.filter(m => m.userSatisfaction).map(m => m.userSatisfaction!);

    return {
      avgSearchTime: totalSearches > 0 ? Math.round(totalSearchTime / totalSearches) : 0,
      avgResultsPerSearch: totalSearches > 0 ? Math.round(totalResults / totalSearches) : 0,
      clickThroughRate: totalResults > 0 ? Math.round((totalClicks / totalResults) * 100) / 100 : 0,
      exportRate: totalResults > 0 ? Math.round((totalExports / totalResults) * 100) / 100 : 0,
      satisfactionScore: satisfactionRatings.length > 0 
        ? Math.round(satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length * 100) / 100
        : 0
    };
  }

  private generateRecommendations(metrics: SearchMetrics[], _history: SearchHistoryItem[]): SearchInsights['recommendations'] {
    const recommendations: SearchInsights['recommendations'] = [];

    // Query recommendations
    const popularQueries = this.getPopularQueries(metrics);
    if (popularQueries.length > 0) {
      const topQuery = popularQueries[0];
      if (topQuery.count > 5) {
        recommendations.push({
          type: 'query',
          title: 'Popular Search Pattern',
          description: `"${topQuery.query}" is your most searched term with ${topQuery.count} searches`,
          confidence: 0.8,
          action: 'Consider saving this as a favorite search'
        });
      }
    }

    // Filter recommendations
    const filterUsage = this.getFilterUsage(metrics);
    if (filterUsage.length > 0) {
      const topFilter = filterUsage[0];
      if (topFilter.usage > 3) {
        recommendations.push({
          type: 'filter',
          title: 'Effective Filter',
          description: `The ${topFilter.filter} filter is used frequently and effective`,
          confidence: 0.7,
          action: 'Consider creating a preset with this filter'
        });
      }
    }

    // Source recommendations
    const topSources = this.getTopSources(metrics);
    if (topSources.length > 1) {
      const mostUsedSource = topSources[0];
      const leastUsedSource = topSources[topSources.length - 1];
      
      if (mostUsedSource.searches > leastUsedSource.searches * 3) {
        recommendations.push({
          type: 'source',
          title: 'Source Usage Imbalance',
          description: `You search ${mostUsedSource.source} much more than other sources`,
          confidence: 0.6,
          action: 'Consider exploring other data sources'
        });
      }
    }

    // Behavior recommendations
    const userBehavior = this.getUserBehavior(metrics);
    if (userBehavior.clickThroughRate < 0.1) {
      recommendations.push({
        type: 'behavior',
        title: 'Low Click-Through Rate',
        description: 'You rarely click on search results',
        confidence: 0.9,
        action: 'Try refining your search queries or using filters'
      });
    }

    if (userBehavior.avgResultsPerSearch > 50) {
      recommendations.push({
        type: 'behavior',
        title: 'Too Many Results',
        description: 'Your searches often return many results',
        confidence: 0.8,
        action: 'Try adding more specific filters to narrow down results'
      });
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  // Performance Analytics
  public getSearchPerformance(): SearchPerformance {
    const metrics = this.getSearchMetrics();
    
    if (metrics.length === 0) {
      return {
        avgSearchTime: 0,
        successRate: 0,
        errorRate: 0,
        cacheHitRate: 0,
        apiResponseTime: 0
      };
    }

    const totalSearches = metrics.length;
    const successfulSearches = metrics.filter(m => m.resultCount > 0).length;
    const totalSearchTime = metrics.reduce((sum, m) => sum + m.searchTime, 0);

    return {
      avgSearchTime: Math.round(totalSearchTime / totalSearches),
      successRate: Math.round((successfulSearches / totalSearches) * 100) / 100,
      errorRate: Math.round(((totalSearches - successfulSearches) / totalSearches) * 100) / 100,
      cacheHitRate: 0, // This would be calculated from actual cache data
      apiResponseTime: Math.round(totalSearchTime / totalSearches)
    };
  }

  // Export Analytics
  public exportAnalytics(): { insights: SearchInsights; performance: SearchPerformance; metrics: SearchMetrics[] } {
    return {
      insights: this.generateSearchInsights(),
      performance: this.getSearchPerformance(),
      metrics: this.getSearchMetrics()
    };
  }

  // Clear Analytics
  public clearAnalytics(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.METRICS_KEY);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Helper Methods
  private getSearchHistory(): SearchHistoryItem[] {
    // This would typically come from SearchHistoryManager
    // For now, we'll return an empty array
    return [];
  }

  private updateMetrics(metrics: SearchMetrics[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.METRICS_KEY, JSON.stringify(metrics));
  }

  private getEmptyInsights(): SearchInsights {
    return {
      popularQueries: [],
      searchTrends: [],
      topSources: [],
      filterUsage: [],
      userBehavior: {
        avgSearchTime: 0,
        avgResultsPerSearch: 0,
        clickThroughRate: 0,
        exportRate: 0,
        satisfactionScore: 0
      },
      recommendations: []
    };
  }
}

export const searchAnalytics = SearchAnalytics.getInstance();
