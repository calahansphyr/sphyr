import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  BarChart3, 
  PieChart,
  Activity,
  Zap,
  Star,
  FileText,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { documentSummarizer } from '@/lib/ai/DocumentSummarizer';
import { contentTagger } from '@/lib/ai/ContentTagger';
import { contentSuggestions } from '@/lib/ai/ContentSuggestions';
import { searchRanker } from '@/lib/ai/SearchRanker';
import { queryProcessor } from '@/lib/ai/QueryProcessor';

interface AIInsightsDashboardProps {
  className?: string;
  showExportButton?: boolean;
  refreshInterval?: number;
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'trend' | 'anomaly' | 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: 'productivity' | 'content' | 'search' | 'collaboration' | 'analysis';
  action?: {
    label: string;
    url: string;
    type: 'internal' | 'external';
  };
  metadata?: {
    source?: string;
    timestamp?: Date;
    relatedDocuments?: string[];
    tags?: string[];
  };
}

interface AIStats {
  totalDocuments: number;
  totalSummaries: number;
  totalTags: number;
  totalSuggestions: number;
  averageConfidence: number;
  processingTime: number;
  accuracy: number;
}

export const AIInsightsDashboard: React.FC<AIInsightsDashboardProps> = ({
  className = "",
  showExportButton = true,
  refreshInterval = 60000 // 1 minute
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'analytics' | 'recommendations' | 'settings'>('overview');

  // Load AI insights and statistics
  const loadAIInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load statistics from various AI services
      const [summaryStats, taggingStats, suggestionStats, rankingStats, _processingStats] = await Promise.all([
        Promise.resolve(documentSummarizer.getStatistics()),
        Promise.resolve(contentTagger.getStatistics()),
        Promise.resolve(contentSuggestions.getCacheStatistics()),
        Promise.resolve(searchRanker.getRankingStatistics()),
        Promise.resolve(queryProcessor.getCacheStatistics())
      ]);

      // Calculate overall stats
      const overallStats: AIStats = {
        totalDocuments: taggingStats.totalDocuments,
        totalSummaries: summaryStats.totalSummaries,
        totalTags: taggingStats.totalTags,
        totalSuggestions: suggestionStats.entries,
        averageConfidence: (summaryStats.averageConfidence + taggingStats.averageConfidence) / 2,
        processingTime: summaryStats.averageProcessingTime,
        accuracy: 0.85 // Mock accuracy score
      };

      setStats(overallStats);

      // Generate AI insights
      const generatedInsights = generateAIInsights(overallStats, summaryStats, taggingStats, rankingStats);
      setInsights(generatedInsights);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate AI insights based on statistics
  const generateAIInsights = (
    overallStats: AIStats,
    summaryStats: Record<string, unknown>,
    taggingStats: Record<string, unknown>,
    rankingStats: Record<string, unknown>
  ): AIInsight[] => {
    const insights: AIInsight[] = [];

    // Productivity insights
    if (overallStats.totalSummaries > 0) {
      insights.push({
        id: 'summary-productivity',
        type: 'success',
        title: 'Document Summarization Active',
        description: `You've generated ${overallStats.totalSummaries} document summaries, saving approximately ${Math.round(overallStats.totalSummaries * 15)} minutes of reading time.`,
        confidence: 0.9,
        impact: 'high',
        category: 'productivity',
        action: {
          label: 'View Summaries',
          url: '/summaries',
          type: 'internal'
        },
        metadata: {
          source: 'DocumentSummarizer',
          timestamp: new Date(),
          tags: ['productivity', 'summarization']
        }
      });
    }

    // Content organization insights
    if (overallStats.totalTags > 0) {
      const avgTagsPerDoc = overallStats.totalTags / overallStats.totalDocuments;
      if (avgTagsPerDoc > 5) {
        insights.push({
          id: 'tagging-success',
          type: 'success',
          title: 'Excellent Content Organization',
          description: `Your documents are well-tagged with an average of ${avgTagsPerDoc.toFixed(1)} tags per document, making them easy to find and organize.`,
          confidence: 0.8,
          impact: 'medium',
          category: 'content',
          metadata: {
            source: 'ContentTagger',
            timestamp: new Date(),
            tags: ['organization', 'tagging']
          }
        });
      }
    }

    // Search optimization insights
    if ((rankingStats as { totalQueries?: number }).totalQueries && (rankingStats as { totalQueries?: number }).totalQueries! > 0) {
      if ((rankingStats as { averageRankingScore?: number }).averageRankingScore && (rankingStats as { averageRankingScore?: number }).averageRankingScore! > 0.7) {
        insights.push({
          id: 'search-optimization',
          type: 'success',
          title: 'Search Results Well-Optimized',
          description: `Your search results have an average ranking score of ${((rankingStats as { averageRankingScore?: number }).averageRankingScore! * 100).toFixed(1)}%, indicating good relevance and personalization.`,
          confidence: 0.8,
          impact: 'medium',
          category: 'search',
          metadata: {
            source: 'SearchRanker',
            timestamp: new Date(),
            tags: ['search', 'optimization']
          }
        });
      }
    }

    // Performance insights
    if (overallStats.processingTime > 0) {
      if (overallStats.processingTime < 1000) {
        insights.push({
          id: 'fast-processing',
          type: 'success',
          title: 'Fast AI Processing',
          description: `AI operations are processing quickly with an average time of ${overallStats.processingTime}ms, ensuring responsive user experience.`,
          confidence: 0.9,
          impact: 'medium',
          category: 'productivity',
          metadata: {
            source: 'AIProcessing',
            timestamp: new Date(),
            tags: ['performance', 'speed']
          }
        });
      } else {
        insights.push({
          id: 'slow-processing',
          type: 'warning',
          title: 'AI Processing Could Be Faster',
          description: `AI operations are taking ${overallStats.processingTime}ms on average. Consider optimizing for better performance.`,
          confidence: 0.7,
          impact: 'medium',
          category: 'productivity',
          action: {
            label: 'Optimize Performance',
            url: '/settings/performance',
            type: 'internal'
          },
          metadata: {
            source: 'AIProcessing',
            timestamp: new Date(),
            tags: ['performance', 'optimization']
          }
        });
      }
    }

    // Content quality insights
    if (overallStats.averageConfidence > 0.8) {
      insights.push({
        id: 'high-confidence',
        type: 'success',
        title: 'High AI Confidence',
        description: `AI operations are performing with ${(overallStats.averageConfidence * 100).toFixed(1)}% average confidence, indicating reliable results.`,
        confidence: 0.9,
        impact: 'high',
        category: 'analysis',
        metadata: {
          source: 'AIConfidence',
          timestamp: new Date(),
          tags: ['confidence', 'reliability']
        }
      });
    }

    // Recommendations for improvement
    if (overallStats.totalDocuments > 10 && overallStats.totalSummaries < overallStats.totalDocuments * 0.3) {
      insights.push({
        id: 'summarization-opportunity',
        type: 'opportunity',
        title: 'Summarization Opportunity',
        description: `You have ${overallStats.totalDocuments} documents but only ${overallStats.totalSummaries} summaries. Consider summarizing more documents to save time.`,
        confidence: 0.8,
        impact: 'high',
        category: 'productivity',
        action: {
          label: 'Summarize Documents',
          url: '/summarize',
          type: 'internal'
        },
        metadata: {
          source: 'DocumentSummarizer',
          timestamp: new Date(),
          tags: ['productivity', 'summarization']
        }
      });
    }

    // Tagging recommendations
    if (overallStats.totalDocuments > 5 && overallStats.totalTags < overallStats.totalDocuments * 2) {
      insights.push({
        id: 'tagging-opportunity',
        type: 'opportunity',
        title: 'Improve Content Organization',
        description: `Consider adding more tags to your documents. Currently averaging ${(overallStats.totalTags / overallStats.totalDocuments).toFixed(1)} tags per document.`,
        confidence: 0.7,
        impact: 'medium',
        category: 'content',
        action: {
          label: 'Auto-Tag Documents',
          url: '/auto-tag',
          type: 'internal'
        },
        metadata: {
          source: 'ContentTagger',
          timestamp: new Date(),
          tags: ['organization', 'tagging']
        }
      });
    }

    return insights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  };

  // Initial load and refresh interval
  useEffect(() => {
    loadAIInsights();
    
    if (refreshInterval > 0) {
      const interval = setInterval(loadAIInsights, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadAIInsights]);

  const handleExport = () => {
    const data = {
      insights,
      stats,
      lastUpdated,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sphyr-ai-insights-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="h-5 w-5" />;
      case 'trend': return <TrendingUp className="h-5 w-5" />;
      case 'anomaly': return <AlertCircle className="h-5 w-5" />;
      case 'opportunity': return <Target className="h-5 w-5" />;
      case 'warning': return <AlertCircle className="h-5 w-5" />;
      case 'success': return <CheckCircle className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'opportunity': return 'text-blue-600 bg-blue-100';
      case 'recommendation': return 'text-purple-600 bg-purple-100';
      case 'trend': return 'text-indigo-600 bg-indigo-100';
      case 'anomaly': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: AIInsight['impact']) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-background-secondary rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-background-secondary rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary-500" />
            AI Insights Dashboard
          </h2>
          <p className="text-text-secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAIInsights}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {showExportButton && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Documents Processed</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalDocuments}</p>
                </div>
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="h-5 w-5 text-primary-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">AI Summaries</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalSummaries}</p>
                </div>
                <div className="p-2 bg-accent-green rounded-lg">
                  <Brain className="h-5 w-5 text-accent-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Content Tags</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalTags}</p>
                </div>
                <div className="p-2 bg-accent-blue rounded-lg">
                  <Filter className="h-5 w-5 text-accent-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">AI Confidence</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {(stats.averageConfidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-accent-purple rounded-lg">
                  <Star className="h-5 w-5 text-accent-purple" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'insights' | 'analytics' | 'settings')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  AI Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Processing Speed</span>
                        <span className="text-sm text-text-muted">{stats.processingTime}ms</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (2000 - stats.processingTime) / 20)} 
                        className="h-2" 
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Accuracy</span>
                        <span className="text-sm text-text-muted">{(stats.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={stats.accuracy * 100} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Confidence</span>
                        <span className="text-sm text-text-muted">{(stats.averageConfidence * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={stats.averageConfidence * 100} className="h-2" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recent Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.slice(0, 3).map((insight) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3 bg-background-tertiary rounded-lg"
                    >
                      <div className={cn("p-1 rounded", getInsightColor(insight.type))}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{insight.title}</p>
                        <p className="text-xs text-text-muted line-clamp-2">
                          {insight.description}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getImpactColor(insight.impact), "text-white")}
                      >
                        {insight.impact}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.length > 0 ? (
                  insights.map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-background-tertiary rounded-lg border-l-4 border-primary-500"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded", getInsightColor(insight.type))}>
                            {getInsightIcon(insight.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                            <p className="text-sm text-text-secondary mb-2">
                              {insight.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {insight.category}
                              </Badge>
                              <Badge 
                                variant="secondary" 
                                className={cn("text-xs", getImpactColor(insight.impact), "text-white")}
                              >
                                {insight.impact} impact
                              </Badge>
                              <span className="text-xs text-text-muted">
                                {(insight.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                          </div>
                        </div>
                        {insight.action && (
                          <Button variant="outline" size="sm">
                            {insight.action.label}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      No AI Insights Yet
                    </h3>
                    <p className="text-text-secondary">
                      Start using AI features to generate personalized insights and recommendations.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Usage Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  AI Usage Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Document Summarization</span>
                      <span className="text-sm text-text-muted">
                        {stats.totalSummaries} summaries
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Content Tagging</span>
                      <span className="text-sm text-text-muted">
                        {stats.totalTags} tags
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">AI Suggestions</span>
                      <span className="text-sm text-text-muted">
                        {stats.totalSuggestions} suggestions
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Processing Time</span>
                      <span className="text-sm text-text-muted">
                        {stats.processingTime}ms avg
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">AI Accuracy</span>
                        <span className="text-sm text-text-muted">
                          {(stats.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={stats.accuracy * 100} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Confidence Score</span>
                        <span className="text-sm text-text-muted">
                          {(stats.averageConfidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={stats.averageConfidence * 100} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Response Time</span>
                        <span className="text-sm text-text-muted">
                          {stats.processingTime}ms
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (2000 - stats.processingTime) / 20)} 
                        className="h-2" 
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.filter(insight => insight.type === 'recommendation' || insight.type === 'opportunity').length > 0 ? (
                  insights
                    .filter(insight => insight.type === 'recommendation' || insight.type === 'opportunity')
                    .map((insight, index) => (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-background-tertiary rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded", getInsightColor(insight.type))}>
                              {getInsightIcon(insight.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                              <p className="text-sm text-text-secondary mb-2">
                                {insight.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {insight.category}
                                </Badge>
                                <span className="text-xs text-text-muted">
                                  {(insight.confidence * 100).toFixed(0)}% confidence
                                </span>
                              </div>
                            </div>
                          </div>
                          {insight.action && (
                            <Button variant="default" size="sm">
                              {insight.action.label}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      No Recommendations Yet
                    </h3>
                    <p className="text-text-secondary">
                      Continue using AI features to receive personalized recommendations.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
