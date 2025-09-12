import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Users, 
  Search,
  Star,
  Download,
  RefreshCw,
  MousePointer,
  Calendar,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { searchAnalytics, SearchInsights, SearchPerformance } from '@/lib/search/SearchAnalytics';

interface SearchAnalyticsDashboardProps {
  className?: string;
  showExportButton?: boolean;
  refreshInterval?: number;
}

export const SearchAnalyticsDashboard: React.FC<SearchAnalyticsDashboardProps> = ({
  className = "",
  showExportButton = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [insights, setInsights] = useState<SearchInsights | null>(null);
  const [performance, setPerformance] = useState<SearchPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const [insightsData, performanceData] = await Promise.all([
        Promise.resolve(searchAnalytics.generateSearchInsights()),
        Promise.resolve(searchAnalytics.getSearchPerformance())
      ]);
      
      setInsights(insightsData);
      setPerformance(performanceData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load search analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and refresh interval
  useEffect(() => {
    loadAnalytics();
    
    if (refreshInterval > 0) {
      const interval = setInterval(loadAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const handleExport = () => {
    const data = searchAnalytics.exportAnalytics();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sphyr-search-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
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

  if (!insights || !performance) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Search className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Search Data Yet</h3>
          <p className="text-text-secondary">
            Start searching to see your analytics and insights here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Search Analytics</h2>
          <p className="text-text-secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Searches</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatNumber(insights.userBehavior.avgSearchTime * 100)}
                </p>
              </div>
              <div className="p-2 bg-primary-100 rounded-lg">
                <Search className="h-5 w-5 text-primary-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Avg Search Time</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatDuration(insights.userBehavior.avgSearchTime)}
                </p>
              </div>
              <div className="p-2 bg-accent-green rounded-lg">
                <Clock className="h-5 w-5 text-accent-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Click-Through Rate</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatPercentage(insights.userBehavior.clickThroughRate)}
                </p>
              </div>
              <div className="p-2 bg-accent-blue rounded-lg">
                <MousePointer className="h-5 w-5 text-accent-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Satisfaction Score</p>
                <p className="text-2xl font-bold text-text-primary">
                  {insights.userBehavior.satisfactionScore.toFixed(1)}/5
                </p>
              </div>
              <div className="p-2 bg-accent-purple rounded-lg">
                <Star className="h-5 w-5 text-accent-purple" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="recommendations">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Queries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Popular Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.popularQueries.slice(0, 5).map((query, index) => (
                    <motion.div
                      key={query.query}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{query.query}</p>
                          <p className="text-xs text-text-muted">
                            {query.avgResults} avg results
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {query.count} searches
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-sm text-text-muted">
                        {formatPercentage(performance.successRate)}
                      </span>
                    </div>
                    <Progress value={performance.successRate * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="text-sm text-text-muted">
                        {formatPercentage(performance.errorRate)}
                      </span>
                    </div>
                    <Progress value={performance.errorRate * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">API Response Time</span>
                      <span className="text-sm text-text-muted">
                        {formatDuration(performance.apiResponseTime)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min((performance.apiResponseTime / 2000) * 100, 100)} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Search Trends (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.searchTrends.slice(-7).map((trend, index) => (
                  <motion.div
                    key={trend.date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(trend.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-text-muted">
                        {trend.avgResults} avg results
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{trend.searches}</p>
                      <p className="text-xs text-text-muted">searches</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.topSources.slice(0, 8).map((source, index) => (
                  <motion.div
                    key={source.source}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm capitalize">{source.source}</p>
                        <p className="text-xs text-text-muted">
                          {source.avgResults} avg results
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {source.searches} searches
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.recommendations.length > 0 ? (
                  insights.recommendations.map((recommendation, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-background-tertiary rounded-lg border-l-4 border-primary-500"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{recommendation.title}</h4>
                          <p className="text-sm text-text-secondary mb-2">
                            {recommendation.description}
                          </p>
                          {recommendation.action && (
                            <p className="text-xs text-primary-500 font-medium">
                              💡 {recommendation.action}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={recommendation.confidence > 0.7 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {formatPercentage(recommendation.confidence)} confidence
                        </Badge>
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
                      Keep searching to get personalized recommendations and insights.
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
