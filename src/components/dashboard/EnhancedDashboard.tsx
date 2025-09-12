import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Brain,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';
import { EnhancedSearchBar } from '@/components/search';
import { cn } from '@/lib/utils';

interface EnhancedDashboardProps {
  className?: string;
  onSearch?: (query: string) => void;
  onConnectIntegration?: () => void;
}

interface SystemStatus {
  connected: number;
  total: number;
  lastSync: string;
  health: 'excellent' | 'good' | 'warning' | 'error';
}

interface RecentSearch {
  query: string;
  results: number;
  timestamp: string;
  provider: string;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  className = "",
  onSearch,
  onConnectIntegration
}) => {
  const [systemStatus] = useState<SystemStatus>({
    connected: 8,
    total: 12,
    lastSync: '2 minutes ago',
    health: 'excellent'
  });

  const [recentSearches] = useState<RecentSearch[]>([
    { query: "Q4 budget planning", results: 24, timestamp: "2 hours ago", provider: "Drive" },
    { query: "client meeting notes", results: 8, timestamp: "Yesterday", provider: "Slack" },
    { query: "expense reports", results: 15, timestamp: "2 days ago", provider: "QuickBooks" }
  ]);

  const getHealthColor = (health: SystemStatus['health']) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getHealthIcon = (health: SystemStatus['health']) => {
    switch (health) {
      case 'excellent': return CheckCircle;
      case 'good': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
    }
  };

  const HealthIcon = getHealthIcon(systemStatus.health);

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#3A8FCD] rounded-2xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
                Find anything, anywhere
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI-powered search across all your connected platforms. Get instant answers from your emails, documents, and project data.
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <EnhancedSearchBar
                placeholder="Try: 'Q4 budget planning' or 'client meeting notes'"
                onSearch={onSearch}
                showAIBranding={true}
                size="large"
                className="shadow-lg"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-[#3A8FCD]" />
                <span>Powered by Cerebras AI</span>
              </div>
              <span>•</span>
              <span>Search across {systemStatus.connected} connected platforms</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Status Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Health Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium",
                  getHealthColor(systemStatus.health)
                )}>
                  <HealthIcon className="h-4 w-4" />
                  <span className="capitalize">{systemStatus.health}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-[#3A8FCD]">{systemStatus.connected}</div>
                  <div className="text-sm text-gray-600">Connected Apps</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{systemStatus.total}</div>
                  <div className="text-sm text-gray-600">Total Available</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{systemStatus.lastSync}</div>
                  <div className="text-sm text-gray-600">Last Sync</div>
                </div>
              </div>
            </motion.div>

            {/* Recent Searches */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Searches</h2>
                <button className="text-[#3A8FCD] hover:text-[#4D70B6] text-sm font-medium">
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {recentSearches.map((search, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#3A8FCD]/10 rounded-lg flex items-center justify-center">
                        <Search className="h-4 w-4 text-[#3A8FCD]" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-[#3A8FCD] transition-colors">
                          {search.query}
                        </div>
                        <div className="text-sm text-gray-500">
                          {search.results} results • {search.timestamp}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {search.provider}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3A8FCD] transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            {/* Connect New Integration */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-[#3A8FCD]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-6 w-6 text-[#3A8FCD]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect More Apps
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Add more integrations to expand your search capabilities
                </p>
                <button
                  onClick={onConnectIntegration}
                  className="w-full bg-[#3A8FCD] text-white py-2 px-4 rounded-lg hover:bg-[#4D70B6] transition-colors font-medium"
                >
                  Browse Integrations
                </button>
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gradient-to-br from-[#3A8FCD]/5 to-[#4D70B6]/5 rounded-2xl border border-[#3A8FCD]/20 p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-[#3A8FCD]" />
                <h3 className="font-semibold text-gray-900">AI Insights</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Your AI assistant has found patterns in your recent searches and can help optimize your workflow.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Budget queries increased 40% this week</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">Most searches happen Tuesday mornings</span>
                </div>
              </div>
            </motion.div>

            {/* Security Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Security Status</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">All connections encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Data access logged</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Regular security audits</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
