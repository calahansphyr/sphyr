import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  Star,
  Zap,
  Brain,
  X,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { recommendationEngine, RecommendationContext } from '@/lib/analytics/RecommendationEngine';
import { userBehaviorTracker } from '@/lib/analytics/UserBehaviorTracker';
import { userPreferencesManager } from '@/lib/analytics/UserPreferences';

interface SmartSearchSuggestionsProps {
  query: string;
  onSuggestionSelect: (suggestion: string) => void;
  onSuggestionDismiss?: (suggestionId: string) => void;
  maxSuggestions?: number;
  showPersonalized?: boolean;
  showTrending?: boolean;
  showRecent?: boolean;
  className?: string;
  userId?: string;
}

interface SuggestionItem {
  id: string;
  text: string;
  type: 'personalized' | 'trending' | 'recent' | 'recommended';
  confidence: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export const SmartSearchSuggestions: React.FC<SmartSearchSuggestionsProps> = ({
  query,
  onSuggestionSelect,
  onSuggestionDismiss,
  maxSuggestions = 8,
  showPersonalized = true,
  showTrending = true,
  showRecent = true,
  className = "",
  userId
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const getPersonalizedSuggestions = useCallback(async (query: string, userId: string): Promise<SuggestionItem[]> => {
    const userProfile = userPreferencesManager.getUserProfile(userId);
    const recentEvents = userBehaviorTracker.getEventQueue();
    
    const context: RecommendationContext = {
      currentPage: window.location.pathname,
      userProfile,
      recentEvents,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      sessionDuration: Date.now() - (userBehaviorTracker.getSession()?.startTime || Date.now())
    };

    const recommendations = recommendationEngine.generateRecommendations(context);
    
    return recommendations
      .filter(rec => rec.type === 'search_suggestion')
      .map(rec => ({
        id: rec.id,
        text: rec.title,
        type: 'personalized' as const,
        confidence: rec.confidence,
        reason: rec.reason,
        metadata: rec.metadata
      }));
  }, []);

  const getTrendingSuggestions = useCallback(async (query: string): Promise<SuggestionItem[]> => {
    // Simulate trending suggestions based on query
    const trendingQueries = [
      'budget planning 2024',
      'client meeting notes',
      'project timeline updates',
      'expense reports',
      'team collaboration',
      'quarterly reviews',
      'contract negotiations',
      'safety protocols'
    ];

    return trendingQueries
      .filter(trending => trending.toLowerCase().includes(query.toLowerCase()) || query.length < 3)
      .slice(0, 3)
      .map((trending, index) => ({
        id: `trending_${index}`,
        text: trending,
        type: 'trending' as const,
        confidence: 0.7 - (index * 0.1),
        reason: 'Trending in your industry',
        metadata: { source: 'trending' }
      }));
  }, []);

  const getRecentSuggestions = useCallback(async (query: string): Promise<SuggestionItem[]> => {
    // Get recent searches from user behavior
    const session = userBehaviorTracker.getSession();
    if (!session) return [];

    const recentSearches = session.events
      .filter(event => event.type === 'search')
      .map(event => event.properties.query as string)
      .filter(Boolean)
      .slice(-5);

    return recentSearches
      .filter(recent => recent.toLowerCase().includes(query.toLowerCase()) || query.length < 3)
      .map((recent, index) => ({
        id: `recent_${index}`,
        text: recent,
        type: 'recent' as const,
        confidence: 0.8 - (index * 0.1),
        reason: 'From your recent searches',
        metadata: { source: 'recent' }
      }));
  }, []);

  const getAIRecommendations = useCallback(async (query: string): Promise<SuggestionItem[]> => {
    // AI-powered suggestions based on query analysis
    const aiSuggestions = [
      {
        pattern: /budget|financial|cost|expense/i,
        suggestions: ['budget planning documents', 'expense reports', 'financial projections', 'cost analysis']
      },
      {
        pattern: /meeting|call|conference/i,
        suggestions: ['meeting notes', 'call recordings', 'conference materials', 'agenda items']
      },
      {
        pattern: /project|task|milestone/i,
        suggestions: ['project timeline', 'task assignments', 'milestone tracking', 'project updates']
      },
      {
        pattern: /client|customer|account/i,
        suggestions: ['client communications', 'customer feedback', 'account information', 'client meetings']
      },
      {
        pattern: /team|staff|employee/i,
        suggestions: ['team updates', 'staff schedules', 'employee records', 'team collaboration']
      }
    ];

    const matchingPattern = aiSuggestions.find(pattern => pattern.pattern.test(query));
    if (!matchingPattern) return [];

    return matchingPattern.suggestions
      .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()) || query.length < 3)
      .slice(0, 2)
      .map((suggestion, index) => ({
        id: `ai_${index}`,
        text: suggestion,
        type: 'recommended' as const,
        confidence: 0.9 - (index * 0.1),
        reason: 'AI-powered suggestion',
        metadata: { source: 'ai', pattern: matchingPattern.pattern.toString() }
      }));
  }, []);

  const generateSuggestions = useCallback(async () => {
    setLoading(true);
    
    try {
      const allSuggestions: SuggestionItem[] = [];

      // Get personalized suggestions
      if (showPersonalized && userId) {
        const personalizedSuggestions = await getPersonalizedSuggestions(query, userId);
        allSuggestions.push(...personalizedSuggestions);
      }

      // Get trending suggestions
      if (showTrending) {
        const trendingSuggestions = await getTrendingSuggestions(query);
        allSuggestions.push(...trendingSuggestions);
      }

      // Get recent suggestions
      if (showRecent) {
        const recentSuggestions = await getRecentSuggestions(query);
        allSuggestions.push(...recentSuggestions);
      }

      // Get AI recommendations
      const aiRecommendations = await getAIRecommendations(query);
      allSuggestions.push(...aiRecommendations);

      // Sort by confidence and remove duplicates
      const uniqueSuggestions = removeDuplicateSuggestions(allSuggestions);
      const sortedSuggestions = uniqueSuggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxSuggestions);

      setSuggestions(sortedSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [query, userId, showPersonalized, showTrending, showRecent, maxSuggestions, getPersonalizedSuggestions, getTrendingSuggestions, getRecentSuggestions, getAIRecommendations]);

  useEffect(() => {
    if (query.length >= 2) {
      generateSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query, generateSuggestions]);

  const removeDuplicateSuggestions = (suggestions: SuggestionItem[]): SuggestionItem[] => {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    onSuggestionSelect(suggestion.text);
    
    // Track suggestion usage
    userBehaviorTracker.trackEvent('search', {
      query: suggestion.text,
      suggestionType: suggestion.type,
      confidence: suggestion.confidence,
      source: 'suggestion'
    });
  };

  const handleSuggestionDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    onSuggestionDismiss?.(suggestionId);
  };

  const getSuggestionIcon = (type: SuggestionItem['type']) => {
    switch (type) {
      case 'personalized':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-600" />;
      case 'recommended':
        return <Brain className="w-4 h-4 text-purple-600" />;
    }
  };

  const getSuggestionColor = (type: SuggestionItem['type']) => {
    switch (type) {
      case 'personalized':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'trending':
        return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'recent':
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
      case 'recommended':
        return 'border-purple-200 bg-purple-50 hover:bg-purple-100';
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion => 
    !dismissedSuggestions.has(suggestion.id)
  );

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 bg-gray-100 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-300 rounded" />
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-300 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredSuggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <Zap className="w-4 h-4" />
        <span>Smart Suggestions</span>
      </div>
      
      <AnimatePresence>
        {filteredSuggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200",
              getSuggestionColor(suggestion.type)
            )}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <div className="flex-shrink-0">
              {getSuggestionIcon(suggestion.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {suggestion.text}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {suggestion.reason}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-gray-500">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSuggestionDismiss(suggestion.id);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SmartSearchSuggestions;
