import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Clock,
  FileText,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { AISearchResult } from '@/types/ai';
import { cn } from '@/lib/utils';

interface AIInsightsProps {
  query: string;
  results: AISearchResult[];
  className?: string;
  onInsightAction?: (action: string, data: unknown) => void;
}

interface Insight {
  id: string;
  type: 'pattern' | 'recommendation' | 'warning' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  action?: {
    label: string;
    type: 'navigate' | 'filter' | 'export' | 'schedule';
    data: unknown;
  };
  metadata: {
    source: string;
    timestamp: string;
    relatedResults: number;
  };
}

const AIInsights: React.FC<AIInsightsProps> = ({
  query,
  results,
  className = "",
  onInsightAction
}) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  // Generate AI insights based on search results
  useEffect(() => {
    if (results.length === 0) {
      setInsights([]);
      return;
    }

    setIsGenerating(true);

    // Simulate AI processing time
    setTimeout(() => {
      const generatedInsights = generateInsights(query, results);
      setInsights(generatedInsights);
      setIsGenerating(false);
    }, 2000);
  }, [query, results]);

  const generateInsights = (searchQuery: string, searchResults: AISearchResult[]): Insight[] => {
    const insights: Insight[] = [];

    // Analyze result patterns
    const sources = [...new Set(searchResults.map(r => r.source))];
    const avgConfidence = searchResults.reduce((acc, r) => 
      acc + ((r.metadata?.confidence as number) || 0), 0) / searchResults.length;

    // Pattern insights
    if (sources.length > 1) {
      insights.push({
        id: 'multi-source',
        type: 'pattern',
        title: 'Multi-Platform Results',
        description: `Your search spans ${sources.length} different platforms, showing comprehensive coverage across your connected systems.`,
        confidence: 0.95,
        actionable: true,
        action: {
          label: 'View by Platform',
          type: 'filter',
          data: { filter: 'source' }
        },
        metadata: {
          source: 'AI Analysis',
          timestamp: new Date().toISOString(),
          relatedResults: searchResults.length
        }
      });
    }

    // Confidence insights
    if (avgConfidence > 0.8) {
      insights.push({
        id: 'high-confidence',
        type: 'recommendation',
        title: 'High-Quality Matches',
        description: `Your search returned results with ${Math.round(avgConfidence * 100)}% average confidence. These are highly relevant matches.`,
        confidence: 0.92,
        actionable: false,
        metadata: {
          source: 'AI Analysis',
          timestamp: new Date().toISOString(),
          relatedResults: searchResults.length
        }
      });
    }

    // Time-based insights
    const recentResults = searchResults.filter(r => {
      const date = new Date(r.createdAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return date > weekAgo;
    });

    if (recentResults.length > searchResults.length * 0.5) {
      insights.push({
        id: 'recent-content',
        type: 'opportunity',
        title: 'Recent Activity Detected',
        description: `${recentResults.length} of your results are from the past week, indicating active project work in this area.`,
        confidence: 0.88,
        actionable: true,
        action: {
          label: 'Focus on Recent',
          type: 'filter',
          data: { filter: 'recent' }
        },
        metadata: {
          source: 'AI Analysis',
          timestamp: new Date().toISOString(),
          relatedResults: recentResults.length
        }
      });
    }

    // Content type insights
    const documentResults = searchResults.filter(r => 
      (r.metadata?.type as string) === 'document'
    );
    const emailResults = searchResults.filter(r => 
      (r.metadata?.type as string) === 'email'
    );

    if (documentResults.length > emailResults.length) {
      insights.push({
        id: 'document-heavy',
        type: 'pattern',
        title: 'Document-Focused Results',
        description: `Most results are documents rather than emails, suggesting this query relates to formal project documentation.`,
        confidence: 0.85,
        actionable: true,
        action: {
          label: 'Export Documents',
          type: 'export',
          data: { type: 'documents' }
        },
        metadata: {
          source: 'AI Analysis',
          timestamp: new Date().toISOString(),
          relatedResults: documentResults.length
        }
      });
    }

    // Query-specific insights
    if (searchQuery.toLowerCase().includes('budget')) {
      insights.push({
        id: 'budget-insight',
        type: 'recommendation',
        title: 'Budget Analysis Opportunity',
        description: 'Consider creating a consolidated budget report by combining data from multiple sources found in your search.',
        confidence: 0.90,
        actionable: true,
        action: {
          label: 'Create Report',
          type: 'navigate',
          data: { page: 'reports', type: 'budget' }
        },
        metadata: {
          source: 'AI Analysis',
          timestamp: new Date().toISOString(),
          relatedResults: searchResults.length
        }
      });
    }

    return insights;
  };

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'pattern': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'warning': return AlertTriangle;
      case 'opportunity': return CheckCircle;
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'pattern': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'recommendation': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'warning': return 'text-red-600 bg-red-50 border-red-200';
      case 'opportunity': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const handleInsightAction = (insight: Insight) => {
    if (insight.action) {
      onInsightAction?.(insight.action.type, insight.action.data);
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#3A8FCD]/10 rounded-xl flex items-center justify-center">
            <Brain className="h-5 w-5 text-[#3A8FCD]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
            <p className="text-sm text-gray-600">
              {isGenerating ? 'Analyzing your results...' : `${insights.length} insights found`}
            </p>
          </div>
        </div>
        {!isGenerating && insights.length > 0 && (
          <button
            onClick={() => {
              setIsGenerating(true);
              setTimeout(() => {
                const newInsights = generateInsights(query, results);
                setInsights(newInsights);
                setIsGenerating(false);
              }, 1500);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Refresh insights"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {isGenerating ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {insights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              const isSelected = selectedInsight === insight.id;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={cn(
                    "border rounded-lg p-4 transition-all cursor-pointer",
                    isSelected ? "border-[#3A8FCD] bg-[#3A8FCD]/5" : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setSelectedInsight(isSelected ? null : insight.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border",
                      getInsightColor(insight.type)
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-xs text-gray-500">
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{insight.metadata.relatedResults} related results</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Just now</span>
                          </div>
                        </div>
                        
                        {insight.actionable && insight.action && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInsightAction(insight);
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-[#3A8FCD] text-white text-xs rounded-lg hover:bg-[#4D70B6] transition-colors"
                          >
                            {insight.action.label}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {!isGenerating && insights.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Brain className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            No specific insights available for this search. Try a more specific query.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
