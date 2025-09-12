import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Search,
  Clock,
  Users,
  Zap,
  Target,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalyticsData {
  overview: {
    totalSearches: number;
    totalSessions: number;
    averageSessionDuration: number;
    topIntegrations: Array<{ name: string; count: number; percentage: number }>;
  };
  searchAnalytics: {
    dailySearches: Array<{ date: string; count: number }>;
    popularQueries: Array<{ query: string; count: number; trend: 'up' | 'down' | 'stable' }>;
    searchSuccessRate: number;
    averageResultsPerSearch: number;
  };
  userBehavior: {
    sessionDuration: Array<{ range: string; count: number }>;
    peakUsageHours: Array<{ hour: number; count: number }>;
    deviceTypes: Array<{ type: string; count: number; percentage: number }>;
    userRetention: number;
  };
  performance: {
    averageLoadTime: number;
    searchResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

interface AnalyticsDashboardProps {
  className?: string;
  userId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = "",
  timeRange = '30d'
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  const generateDailyData = useCallback((timeRange: string) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50) + 20
      });
    }
    
    return data;
  }, []);

  const generateHourlyData = useCallback(() => {
    const data = [];
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        hour,
        count: Math.floor(Math.random() * 20) + (hour >= 9 && hour <= 17 ? 10 : 0)
      });
    }
    return data;
  }, []);

  const simulateAnalyticsData = useCallback(async (timeRange: string): Promise<AnalyticsData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const multiplier = timeRange === '7d' ? 1 : timeRange === '30d' ? 4 : timeRange === '90d' ? 12 : 48;

    return {
      overview: {
        totalSearches: 1247 * multiplier,
        totalSessions: 89 * multiplier,
        averageSessionDuration: 12.5,
        topIntegrations: [
          { name: 'Gmail', count: 456 * multiplier, percentage: 36.6 },
          { name: 'Google Drive', count: 342 * multiplier, percentage: 27.4 },
          { name: 'Slack', count: 234 * multiplier, percentage: 18.8 },
          { name: 'Calendar', count: 123 * multiplier, percentage: 9.9 },
          { name: 'Asana', count: 92 * multiplier, percentage: 7.4 }
        ]
      },
      searchAnalytics: {
        dailySearches: generateDailyData(timeRange),
        popularQueries: [
          { query: 'budget planning', count: 45 * multiplier, trend: 'up' },
          { query: 'client meeting notes', count: 38 * multiplier, trend: 'stable' },
          { query: 'project timeline', count: 32 * multiplier, trend: 'up' },
          { query: 'expense reports', count: 28 * multiplier, trend: 'down' },
          { query: 'team updates', count: 25 * multiplier, trend: 'up' }
        ],
        searchSuccessRate: 87.3,
        averageResultsPerSearch: 12.4
      },
      userBehavior: {
        sessionDuration: [
          { range: '0-5 min', count: 23 * multiplier },
          { range: '5-15 min', count: 45 * multiplier },
          { range: '15-30 min', count: 18 * multiplier },
          { range: '30+ min', count: 14 * multiplier }
        ],
        peakUsageHours: generateHourlyData(),
        deviceTypes: [
          { type: 'Desktop', count: 67 * multiplier, percentage: 75.3 },
          { type: 'Mobile', count: 18 * multiplier, percentage: 20.2 },
          { type: 'Tablet', count: 4 * multiplier, percentage: 4.5 }
        ],
        userRetention: 78.5
      },
      performance: {
        averageLoadTime: 1.2,
        searchResponseTime: 0.8,
        errorRate: 0.3,
        uptime: 99.7
      }
    };
  }, [generateDailyData, generateHourlyData]);

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call - in a real application, this would fetch from your analytics service
      const data = await simulateAnalyticsData(selectedTimeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange, simulateAnalyticsData]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);



  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={(value: "7d" | "30d" | "90d" | "1y") => setSelectedTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={cn("text-center py-12", className)}>
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Analytics data will appear here once you start using the application.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Insights into your search usage and performance</p>
        </div>
        <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={(value: "7d" | "30d" | "90d" | "1y") => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalSearches)}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last period
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalSessions)}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last period
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.averageSessionDuration}m</div>
              <p className="text-xs text-muted-foreground">
                +2.3% from last period
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Search Success Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.searchAnalytics.searchSuccessRate}%</div>
              <p className="text-xs text-muted-foreground">
                +1.2% from last period
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Top Integrations</CardTitle>
            <CardDescription>Most frequently used integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.overview.topIntegrations.map((integration) => (
                <div key={integration.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#3A8FCD]/10 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-[#3A8FCD]" />
                    </div>
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-gray-600">{integration.count} searches</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{integration.percentage}%</p>
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3A8FCD] rounded-full transition-all duration-500"
                        style={{ width: `${integration.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Popular Queries */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Popular Search Queries</CardTitle>
            <CardDescription>Most searched terms and their trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.searchAnalytics.popularQueries.map((query, index) => (
                <div key={query.query} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">&ldquo;{query.query}&rdquo;</p>
                      <p className="text-sm text-gray-600">{query.count} searches</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(query.trend)}
                    <span className="text-sm text-gray-600 capitalize">{query.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Application performance and reliability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analyticsData.performance.averageLoadTime}s</div>
                <p className="text-sm text-gray-600">Avg Load Time</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analyticsData.performance.searchResponseTime}s</div>
                <p className="text-sm text-gray-600">Search Response</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analyticsData.performance.errorRate}%</div>
                <p className="text-sm text-gray-600">Error Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analyticsData.performance.uptime}%</div>
                <p className="text-sm text-gray-600">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
