import { SearchResult } from '@/types/integrations';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  source: string;
  filters?: Record<string, unknown>;
  sort?: string;
  isFavorite?: boolean;
  tags?: string[];
}

export interface SearchAnalytics {
  totalSearches: number;
  averageResults: number;
  mostUsedQueries: Array<{ query: string; count: number }>;
  searchTrends: Array<{ date: string; count: number }>;
  topSources: Array<{ source: string; count: number }>;
  averageSearchTime: number;
}

class SearchHistoryManager {
  private static instance: SearchHistoryManager;
  private readonly STORAGE_KEY = 'sphyr-search-history';
  private readonly FAVORITES_KEY = 'sphyr-search-favorites';
  private readonly ANALYTICS_KEY = 'sphyr-search-analytics';
  private readonly MAX_HISTORY_ITEMS = 100;
  private readonly MAX_FAVORITES = 50;

  public static getInstance(): SearchHistoryManager {
    if (!SearchHistoryManager.instance) {
      SearchHistoryManager.instance = new SearchHistoryManager();
    }
    return SearchHistoryManager.instance;
  }

  // Search History Methods
  public addSearchHistory(
    query: string,
    results: SearchResult[],
    source: string = 'global',
    filters?: Record<string, any>,
    sort?: string
  ): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getSearchHistory();
      const newItem: SearchHistoryItem = {
        id: this.generateId(),
        query: query.trim(),
        timestamp: new Date(),
        resultCount: results.length,
        source,
        filters,
        sort,
        isFavorite: false,
        tags: this.extractTags(query)
      };

      // Remove duplicate queries and add new one at the beginning
      const filteredHistory = history.filter(item => item.query !== newItem.query);
      const updatedHistory = [newItem, ...filteredHistory].slice(0, this.MAX_HISTORY_ITEMS);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
      this.updateAnalytics(newItem);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  public getSearchHistory(): SearchHistoryItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const history = JSON.parse(stored);
      return history.map((item: SearchHistoryItem) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load search history:', error);
      return [];
    }
  }

  public getRecentSearches(limit: number = 10): SearchHistoryItem[] {
    return this.getSearchHistory().slice(0, limit);
  }

  public clearSearchHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  public removeSearchHistoryItem(id: string): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getSearchHistory();
      const updatedHistory = history.filter(item => item.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to remove search history item:', error);
    }
  }

  // Favorites Methods
  public addToFavorites(id: string): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getSearchHistory();
      const favorites = this.getFavorites();
      
      const item = history.find(h => h.id === id);
      if (!item) return;

      // Check if already in favorites
      if (favorites.some(f => f.id === id)) return;

      // Check favorites limit
      if (favorites.length >= this.MAX_FAVORITES) {
        // Remove oldest favorite
        const oldestFavorite = favorites[favorites.length - 1];
        this.removeFromFavorites(oldestFavorite.id);
      }

      const favoriteItem = { ...item, isFavorite: true };
      const updatedFavorites = [favoriteItem, ...favorites];
      
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(updatedFavorites));
      
      // Update history item
      const updatedHistory = history.map(h => 
        h.id === id ? { ...h, isFavorite: true } : h
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to add to favorites:', error);
    }
  }

  public removeFromFavorites(id: string): void {
    if (typeof window === 'undefined') return;

    try {
      const favorites = this.getFavorites();
      const updatedFavorites = favorites.filter(item => item.id !== id);
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(updatedFavorites));

      // Update history item
      const history = this.getSearchHistory();
      const updatedHistory = history.map(h => 
        h.id === id ? { ...h, isFavorite: false } : h
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
    }
  }

  public getFavorites(): SearchHistoryItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.FAVORITES_KEY);
      if (!stored) return [];

      const favorites = JSON.parse(stored);
      return favorites.map((item: SearchHistoryItem) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load favorites:', error);
      return [];
    }
  }

  public isFavorite(id: string): boolean {
    return this.getFavorites().some(item => item.id === id);
  }

  // Analytics Methods
  public getSearchAnalytics(): SearchAnalytics {
    if (typeof window === 'undefined') {
      return {
        totalSearches: 0,
        averageResults: 0,
        mostUsedQueries: [],
        searchTrends: [],
        topSources: [],
        averageSearchTime: 0
      };
    }

    try {
      const stored = localStorage.getItem(this.ANALYTICS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load search analytics:', error);
    }

    return this.calculateAnalytics();
  }

  private calculateAnalytics(): SearchAnalytics {
    const history = this.getSearchHistory();
    
    if (history.length === 0) {
      return {
        totalSearches: 0,
        averageResults: 0,
        mostUsedQueries: [],
        searchTrends: [],
        topSources: [],
        averageSearchTime: 0
      };
    }

    // Calculate most used queries
    const queryCounts: Record<string, number> = {};
    history.forEach(item => {
      queryCounts[item.query] = (queryCounts[item.query] || 0) + 1;
    });

    const mostUsedQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate search trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSearches = history.filter(item => item.timestamp >= thirtyDaysAgo);
    const trendMap: Record<string, number> = {};
    
    recentSearches.forEach(item => {
      const date = item.timestamp.toISOString().split('T')[0];
      trendMap[date] = (trendMap[date] || 0) + 1;
    });

    const searchTrends = Object.entries(trendMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate top sources
    const sourceCounts: Record<string, number> = {};
    history.forEach(item => {
      sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
    });

    const topSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const analytics: SearchAnalytics = {
      totalSearches: history.length,
      averageResults: history.reduce((sum, item) => sum + item.resultCount, 0) / history.length,
      mostUsedQueries,
      searchTrends,
      topSources,
      averageSearchTime: 0 // This would be calculated from actual search times
    };

    // Save analytics
    try {
      localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(analytics));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }

    return analytics;
  }

  private updateAnalytics(_newItem: SearchHistoryItem): void {
    // This would be called after each search to update analytics
    // For now, we'll recalculate on demand
    this.calculateAnalytics();
  }

  // Utility Methods
  private generateId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractTags(query: string): string[] {
    // Simple tag extraction based on common patterns
    const tags: string[] = [];
    
    // Extract quoted phrases
    const quotedMatches = query.match(/"([^"]+)"/g);
    if (quotedMatches) {
      tags.push(...quotedMatches.map(match => match.replace(/"/g, '')));
    }

    // Extract common business terms
    const businessTerms = [
      'budget', 'report', 'meeting', 'contract', 'invoice', 'proposal',
      'timeline', 'milestone', 'deadline', 'review', 'approval', 'change'
    ];

    businessTerms.forEach(term => {
      if (query.toLowerCase().includes(term)) {
        tags.push(term);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  // Search Suggestions
  public getSearchSuggestions(query: string, limit: number = 5): string[] {
    if (!query.trim()) return [];

    const history = this.getSearchHistory();
    const suggestions: string[] = [];

    // Get exact matches first
    const exactMatches = history
      .filter(item => item.query.toLowerCase().includes(query.toLowerCase()))
      .map(item => item.query)
      .slice(0, limit);

    suggestions.push(...exactMatches);

    // Get similar queries if we need more suggestions
    if (suggestions.length < limit) {
      const similarQueries = history
        .filter(item => {
          const words = query.toLowerCase().split(' ');
          const itemWords = item.query.toLowerCase().split(' ');
          return words.some(word => itemWords.some(itemWord => itemWord.includes(word)));
        })
        .map(item => item.query)
        .filter(suggestion => !suggestions.includes(suggestion))
        .slice(0, limit - suggestions.length);

      suggestions.push(...similarQueries);
    }

    return suggestions;
  }

  // Export/Import
  public exportData(): { history: SearchHistoryItem[]; favorites: SearchHistoryItem[]; analytics: SearchAnalytics } {
    return {
      history: this.getSearchHistory(),
      favorites: this.getFavorites(),
      analytics: this.getSearchAnalytics()
    };
  }

  public importData(data: { history: SearchHistoryItem[]; favorites: SearchHistoryItem[] }): void {
    if (typeof window === 'undefined') return;

    try {
      if (data.history) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.history));
      }
      if (data.favorites) {
        localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(data.favorites));
      }
    } catch (error) {
      console.error('Failed to import search data:', error);
    }
  }
}

export const searchHistoryManager = SearchHistoryManager.getInstance();
