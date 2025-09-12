import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Activity,
  Target,
  Zap,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UsagePattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  insights: string[];
  recommendations: string[];
}

interface PatternAnalysis {
  searchPatterns: UsagePattern[];
  timePatterns: {
    peakHours: Array<{ hour: number; count: number; percentage: number }>;
    dailyUsage: Array<{ day: string; count: number; trend: 'up' | 'down' | 'stable' }>;
    sessionPatterns: Array<{ duration: string; count: number; percentage: number }>;
  };
  integrationPatterns: {
    mostUsed: Array<{ name: string; count: number; trend: 'up' | 'down' | 'stable' }>;
    usageCombinations: Array<{ integrations: string[]; frequency: number; percentage: number }>;
    adoptionRate: Array<{ integration: string; adoptionRate: number; trend: 'up' | 'down' | 'stable' }>;
  };
  userBehaviorPatterns: {
    searchSuccessRate: number;
    averageQueryLength: number;
    filterUsage: Array<{ filter: string; usage: number; effectiveness: number }>;
    navigationPatterns: Array<{ pattern: string; frequency: number; efficiency: number }>;
  };
}

interface UsagePatternAnalysisProps {
  className?: string;
  userId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  showInsights?: boolean;
  showRecommendations?: boolean;
}

export const UsagePatternAnalysis: React.FC<UsagePatternAnalysisProps> = ({
  className = "",
  timeRange = '30d',
  showInsights = true,
  showRecommendations = true
}) => {
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  const generatePeakHours = useCallback(() => {
    const hours = [];
    for (let hour = 0; hour < 24; hour++) {
      let count = Math.floor(Math.random() * 20) + 5;
      if (hour >= 9 && hour <= 17) count += 15; // Business hours
      if (hour >= 12 && hour <= 13) count += 10; // Lunch break
      
      hours.push({
        hour,
        count,
        percentage: (count / 50) * 100
      });
    }
    return hours;
  }, []);

  const generateDailyUsage = useCallback((timeRange: string) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const dailyData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      let count = Math.floor(Math.random() * 30) + 10;
      if (dayName === 'Sat' || dayName === 'Sun') count = Math.floor(count * 0.3); // Weekend
      
      dailyData.push({
        day: dayName,
        count,
        trend: (Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
      });
    }
    
    return dailyData.slice(-7); // Return last 7 days
  }, []);

  const generatePatternAnalysis = useCallback(async (timeRange: string): Promise<PatternAnalysis> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const multiplier = timeRange === '7d' ? 1 : timeRange === '30d' ? 4 : timeRange === '90d' ? 12 : 48;

    return {
      searchPatterns: [
        {
          id: 'budget_queries',
          name: 'Budget & Financial Queries',
          description: 'Searches related to budgeting, expenses, and financial planning',
          frequency: 45 * multiplier,
          trend: 'increasing',
          confidence: 0.85,
          insights: [
            'Peak usage on Mondays and Fridays',
            'Most common during morning hours (9-11 AM)',
            'Often followed by QuickBooks integration usage'
          ],
          recommendations: [
            'Set up automated budget reports',
            'Create saved searches for common budget queries',
            'Integrate with accounting software for real-time data'
          ]
        },
        {
          id: 'project_management',
          name: 'Project Management Searches',
          description: 'Queries related to project timelines, tasks, and team coordination',
          frequency: 38 * multiplier,
          trend: 'stable',
          confidence: 0.78,
          insights: [
            'Consistent usage throughout the week',
            'Higher activity during project kickoff periods',
            'Often combined with Asana or Trello integrations'
          ],
          recommendations: [
            'Create project-specific search templates',
            'Set up project milestone alerts',
            'Integrate with project management tools'
          ]
        },
        {
          id: 'client_communications',
          name: 'Client Communication Searches',
          description: 'Searches for client emails, meeting notes, and communications',
          frequency: 32 * multiplier,
          trend: 'increasing',
          confidence: 0.72,
          insights: [
            'Peak usage on Tuesdays and Thursdays',
            'Most active during business hours (10 AM - 4 PM)',
            'Often followed by Gmail or Outlook integration usage'
          ],
          recommendations: [
            'Set up client-specific search folders',
            'Create automated client communication summaries',
            'Integrate with CRM systems for better tracking'
          ]
        }
      ],
      timePatterns: {
        peakHours: generatePeakHours(),
        dailyUsage: generateDailyUsage(timeRange),
        sessionPatterns: [
          { duration: '0-5 min', count: 23 * multiplier, percentage: 25.8 },
          { duration: '5-15 min', count: 45 * multiplier, percentage: 50.6 },
          { duration: '15-30 min', count: 18 * multiplier, percentage: 20.2 },
          { duration: '30+ min', count: 3 * multiplier, percentage: 3.4 }
        ]
      },
      integrationPatterns: {
        mostUsed: [
          { name: 'Gmail', count: 456 * multiplier, trend: 'up' },
          { name: 'Google Drive', count: 342 * multiplier, trend: 'stable' },
          { name: 'Slack', count: 234 * multiplier, trend: 'up' },
          { name: 'Calendar', count: 123 * multiplier, trend: 'down' },
          { name: 'Asana', count: 92 * multiplier, trend: 'up' }
        ],
        usageCombinations: [
          { integrations: ['Gmail', 'Google Drive'], frequency: 89 * multiplier, percentage: 35.2 },
          { integrations: ['Slack', 'Calendar'], frequency: 67 * multiplier, percentage: 26.5 },
          { integrations: ['Gmail', 'Slack'], frequency: 45 * multiplier, percentage: 17.8 },
          { integrations: ['Google Drive', 'Asana'], frequency: 32 * multiplier, percentage: 12.7 },
          { integrations: ['Gmail', 'Calendar', 'Slack'], frequency: 20 * multiplier, percentage: 7.9 }
        ],
        adoptionRate: [
          { integration: 'Gmail', adoptionRate: 95.2, trend: 'up' },
          { integration: 'Google Drive', adoptionRate: 87.3, trend: 'stable' },
          { integration: 'Slack', adoptionRate: 78.9, trend: 'up' },
          { integration: 'Calendar', adoptionRate: 65.4, trend: 'down' },
          { integration: 'Asana', adoptionRate: 45.6, trend: 'up' }
        ]
      },
      userBehaviorPatterns: {
        searchSuccessRate: 87.3,
        averageQueryLength: 4.2,
        filterUsage: [
          { filter: 'Date Range', usage: 78.5, effectiveness: 85.2 },
          { filter: 'Integration Type', usage: 65.3, effectiveness: 72.1 },
          { filter: 'File Type', usage: 45.7, effectiveness: 68.9 },
          { filter: 'Author', usage: 32.1, effectiveness: 55.4 },
          { filter: 'Keywords', usage: 28.9, effectiveness: 61.2 }
        ],
        navigationPatterns: [
          { pattern: 'Search → Results → Click', frequency: 45.2, efficiency: 78.5 },
          { pattern: 'Search → Filter → Results', frequency: 32.1, efficiency: 82.3 },
          { pattern: 'Search → Refine → Results', frequency: 18.7, efficiency: 75.9 },
          { pattern: 'Search → Export → Results', frequency: 4.0, efficiency: 88.1 }
        ]
      }
    };
  }, [generateDailyUsage, generatePeakHours]);

  const loadPatternAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generatePatternAnalysis(selectedTimeRange);
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to load pattern analysis:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange, generatePatternAnalysis]);

  useEffect(() => {
    loadPatternAnalysis();
  }, [loadPatternAnalysis]);



  const getTrendIcon = (trend: 'up' | 'down' | 'stable' | 'increasing' | 'decreasing') => {
    switch (trend) {
      case 'up':
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
      case 'decreasing':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable' | 'increasing' | 'decreasing') => {
    switch (trend) {
      case 'up':
      case 'increasing':
        return 'text-green-600 bg-green-50';
      case 'down':
      case 'decreasing':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Usage Pattern Analysis</h2>
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={cn("text-center py-12", className)}>
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pattern Data</h3>
        <p className="text-gray-600">Usage patterns will appear here once you start using the application.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usage Pattern Analysis</h2>
          <p className="text-gray-600">Insights into your search behavior and usage patterns</p>
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
        </div>
      </div>

      {/* Search Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Patterns
            </CardTitle>
            <CardDescription>Most common search patterns and their trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.searchPatterns.map((pattern, index) => (
                <motion.div
                  key={pattern.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{pattern.name}</h4>
                      <p className="text-sm text-gray-600">{pattern.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{pattern.frequency} searches</span>
                      <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs", getTrendColor(pattern.trend))}>
                        {getTrendIcon(pattern.trend)}
                        <span className="capitalize">{pattern.trend}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showInsights && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Key Insights</h5>
                        <ul className="space-y-1">
                          {pattern.insights.map((insight, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {showRecommendations && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h5>
                        <ul className="space-y-1">
                          {pattern.recommendations.map((recommendation, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                              {recommendation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Time Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Patterns
            </CardTitle>
            <CardDescription>When and how long you use the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Peak Hours */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Peak Usage Hours</h4>
                <div className="space-y-2">
                  {analysis.timePatterns.peakHours
                    .filter(hour => hour.count > 10)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((hour) => (
                      <div key={hour.hour} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {hour.hour}:00 - {hour.hour + 1}:00
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${hour.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{hour.count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Daily Usage */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Daily Usage</h4>
                <div className="space-y-2">
                  {analysis.timePatterns.dailyUsage.map((day) => (
                    <div key={day.day} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{day.day}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${(day.count / 50) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium w-8 text-right">{day.count}</span>
                          {getTrendIcon(day.trend)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Patterns */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Session Duration</h4>
                <div className="space-y-2">
                  {analysis.timePatterns.sessionPatterns.map((session) => (
                    <div key={session.duration} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{session.duration}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${session.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{session.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Integration Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Integration Patterns
            </CardTitle>
            <CardDescription>How you use different integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Used Integrations */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Most Used Integrations</h4>
                <div className="space-y-3">
                  {analysis.integrationPatterns.mostUsed.map((integration, index) => (
                    <div key={integration.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-[#3A8FCD]/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">{integration.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{integration.count} uses</span>
                        {getTrendIcon(integration.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Combinations */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Common Integration Combinations</h4>
                <div className="space-y-3">
                  {analysis.integrationPatterns.usageCombinations.map((combo, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {combo.integrations.slice(0, 3).map((integration, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 bg-[#3A8FCD]/20 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white"
                            >
                              {integration.charAt(0)}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {combo.integrations.join(' + ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{combo.frequency} times</div>
                        <div className="text-xs text-gray-500">{combo.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* User Behavior Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              User Behavior Patterns
            </CardTitle>
            <CardDescription>How effectively you use search features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Search Effectiveness */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Search Effectiveness</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${analysis.userBehaviorPatterns.searchSuccessRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{analysis.userBehaviorPatterns.searchSuccessRate}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Query Length</span>
                    <span className="text-sm font-medium">{analysis.userBehaviorPatterns.averageQueryLength} words</span>
                  </div>
                </div>
              </div>

              {/* Filter Usage */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Filter Usage & Effectiveness</h4>
                <div className="space-y-3">
                  {analysis.userBehaviorPatterns.filterUsage.map((filter) => (
                    <div key={filter.filter} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{filter.filter}</span>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-medium">{filter.usage}% usage</div>
                          <div className="text-xs text-gray-500">{filter.effectiveness}% effective</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UsagePatternAnalysis;
