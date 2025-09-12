import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Globe, 
  Brain, 
  Zap, 
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlobalSearchBar } from '@/components/search';
import { useOnboarding } from '@/context/OnboardingContext';
import { cn } from '@/lib/utils';

interface SimplifiedDashboardProps {
  onSearch: (query: string) => void;
  onNavigate: (path: string) => void;
}

export const SimplifiedDashboard: React.FC<SimplifiedDashboardProps> = ({
  onSearch,
  onNavigate
}) => {
  const { data: onboardingData } = useOnboarding();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sphyr-recent-searches');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to load recent searches:', error);
        }
      }
    }
  }, []);

  const handleQuickSearch = (query: string) => {
    // Add to recent searches
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('sphyr-recent-searches', JSON.stringify(newRecentSearches));
    }
    
    onSearch(query);
  };

  const exampleSearches = [
    "Q4 budget planning documents",
    "client meeting notes from last week",
    "expense reports for project Alpha",
    "RFI responses from subcontractors",
    "change order approvals",
    "safety inspection reports"
  ];

  const quickActions = [
    {
      id: 'search',
      title: 'Start Searching',
      description: 'Search across all your connected platforms',
      icon: Search,
      color: 'bg-primary-500',
      action: () => onSearch('')
    },
    {
      id: 'integrations',
      title: 'Connect Tools',
      description: 'Add more platforms to search',
      icon: Globe,
      color: 'bg-accent-green',
      action: () => onNavigate('/integrations')
    },
    {
      id: 'ai',
      title: 'AI Features',
      description: 'Explore intelligent insights',
      icon: Brain,
      color: 'bg-accent-purple',
      action: () => onNavigate('/ai')
    }
  ];

  const connectedIntegrations = onboardingData?.integrations?.selected || [];
  const userName = onboardingData?.profile?.name || 'there';

  return (
    <div className="max-w-6xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-text-primary">
                Welcome back, {userName}! 👋
              </h1>
            </div>
            
            <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
              Your AI-powered knowledge hub is ready. Search across all your connected platforms 
              and discover insights with intelligent analysis.
            </p>

            {/* Main Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <GlobalSearchBar
                placeholder="Search across all your connected platforms..."
                onSearch={handleQuickSearch}
                size="large"
                showAIBranding={true}
                showSuggestions={true}
                className="shadow-lg"
              />
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <Card 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={action.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={cn("p-3 rounded-lg text-white", action.color)}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-primary-500 group-hover:text-primary-600 transition-colors">
                    <span className="text-sm font-medium">Get started</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Searches / Smart Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSearches.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-primary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    No Recent Searches Yet
                  </h3>
                  <p className="text-text-secondary mb-6 max-w-md mx-auto">
                    Start your first search to see your history here. Here are some ideas to get started:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
                    {exampleSearches.slice(0, 4).map((search, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <Button 
                          variant="secondary" 
                          className="w-full justify-start text-left h-auto p-3"
                          onClick={() => handleQuickSearch(search)}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary-500" />
                            <span className="text-sm">{search}</span>
                          </div>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSearches.map((search, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg hover:bg-background-tertiary/80 transition-colors cursor-pointer group"
                      onClick={() => handleQuickSearch(search)}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-text-primary group-hover:text-primary-500 transition-colors">
                          {search}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary-500 transition-colors" />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Connected Integrations Status */}
        {connectedIntegrations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent-green" />
                  Connected Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {connectedIntegrations.map((integration) => (
                    <Badge key={integration} variant="secondary" className="text-sm">
                      {integration}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  You can search across {connectedIntegrations.length} connected platform{connectedIntegrations.length !== 1 ? 's' : ''}. 
                  <Button 
                    variant="link" 
                    className="p-0 h-auto ml-1"
                    onClick={() => onNavigate('/integrations')}
                  >
                    Add more integrations
                  </Button>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Getting Started Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <Card className="bg-primary-50 border-primary-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary-500 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-700 mb-2">
                    Pro Tip: Use Natural Language
                  </h3>
                  <p className="text-primary-600 text-sm mb-3">
                    Try searching with natural language like &quot;Show me all budget documents from last quarter&quot; 
                    instead of just &quot;budget&quot;. Our AI understands context and intent.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-primary-300 text-primary-700 hover:bg-primary-100"
                      onClick={() => handleQuickSearch("Show me all budget documents from last quarter")}
                    >
                      Try Example
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-primary-700 hover:bg-primary-100"
                      onClick={() => onNavigate('/help')}
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};
