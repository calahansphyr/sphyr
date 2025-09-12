/**
 * AI Features Page
 * Demonstrates advanced AI capabilities and insights
 */

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { AIInsightsDashboard } from '@/components/ai';
import { SearchResult } from '@/types/integrations';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  Zap, 
  Target, 
  FileText,
  Search,
  Filter,
  Lightbulb,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { documentSummarizer } from '@/lib/ai/DocumentSummarizer';
import { contentTagger } from '@/lib/ai/ContentTagger';
import { contentSuggestions } from '@/lib/ai/ContentSuggestions';

export default function AIPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'insights' | 'demo'>('overview');
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Demo data for AI features
  const demoDocument: SearchResult = {
    id: 'demo-doc-1',
    title: 'Q4 Budget Planning Document',
    content: 'This comprehensive budget planning document outlines our Q4 2024 financial strategy. Key highlights include a 15% increase in marketing budget allocation, new hiring plans for the engineering team, and strategic investments in AI technology. The document also covers risk assessment, contingency planning, and performance metrics for the upcoming quarter. We expect to achieve a 20% revenue growth target through these initiatives.',
    source: 'google',
    url: 'https://docs.google.com/document/demo',
    createdAt: new Date().toISOString(),
    author: 'John Doe',
    tags: ['budget', 'planning', 'Q4', 'financial', 'strategy'],
    size: 245760,
    contentType: 'document'
  };

  const handleDemoSummarize = async () => {
    setIsDemoLoading(true);
    try {
      const summary = await documentSummarizer.summarizeDocument({
        document: demoDocument,
        options: {
          maxLength: 200,
          format: 'executive',
          includeKeyPoints: true,
          includeActionItems: true,
          includeMetrics: true,
          language: 'en',
          tone: 'professional'
        },
        userId: 'demo-user',
        organizationId: 'demo-org'
      });
      
      console.log('Demo Summary:', summary);
      // In a real app, you'd display this in the UI
    } catch (error) {
      console.error('Demo summarization failed:', error);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleDemoTag = async () => {
    setIsDemoLoading(true);
    try {
      const taggingResult = await contentTagger.tagContent(
        demoDocument,
        {
          includeSentiment: true,
          includeEntities: true,
          includeTopics: true,
          includeActions: true,
          includeCustomTags: true,
          maxTags: 10,
          minConfidence: 0.5,
          language: 'en',
          domain: 'business'
        },
        'demo-user'
      );
      
      console.log('Demo Tagging Result:', taggingResult);
      // In a real app, you'd display this in the UI
    } catch (error) {
      console.error('Demo tagging failed:', error);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleDemoSuggestions = async () => {
    setIsDemoLoading(true);
    try {
      const suggestions = await contentSuggestions.generateSuggestions(
        {
          currentDocument: demoDocument,
          userHistory: [demoDocument],
          userTags: [],
          userPreferences: {
            preferredSources: ['google', 'notion'],
            interestedTopics: ['budget', 'planning'],
            skillLevel: 'intermediate',
            timeAvailability: 'moderate'
          },
          organizationContext: {
            department: 'Finance',
            role: 'Manager',
            currentProjects: ['Q4 Planning'],
            teamSize: 5
          }
        },
        {
          maxSuggestions: 5,
          includeTypes: ['related_document', 'template', 'recommended_action'],
          minConfidence: 0.6,
          minRelevance: 0.5,
          timeHorizon: 'short_term',
          focusArea: 'productivity'
        }
      );
      
      console.log('Demo Suggestions:', suggestions);
      // In a real app, you'd display this in the UI
    } catch (error) {
      console.error('Demo suggestions failed:', error);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const aiFeatures = [
    {
      id: 'summarization',
      title: 'Document Summarization',
      description: 'AI-powered document summarization with multiple formats and intelligent key point extraction.',
      icon: FileText,
      color: 'bg-blue-500',
      features: ['Executive summaries', 'Bullet point formats', 'Key insights extraction', 'Action items identification'],
      demoAction: handleDemoSummarize
    },
    {
      id: 'tagging',
      title: 'Intelligent Content Tagging',
      description: 'Automatic content categorization and tagging with sentiment analysis and entity recognition.',
      icon: Filter,
      color: 'bg-green-500',
      features: ['Automatic categorization', 'Sentiment analysis', 'Entity recognition', 'Custom tag suggestions'],
      demoAction: handleDemoTag
    },
    {
      id: 'suggestions',
      title: 'Smart Content Suggestions',
      description: 'AI-driven recommendations for related content, templates, and actions based on context.',
      icon: Lightbulb,
      color: 'bg-purple-500',
      features: ['Related documents', 'Template suggestions', 'Action recommendations', 'Trending topics'],
      demoAction: handleDemoSuggestions
    },
    {
      id: 'ranking',
      title: 'Intelligent Search Ranking',
      description: 'AI-powered search result ranking with personalization and relevance scoring.',
      icon: Search,
      color: 'bg-orange-500',
      features: ['Relevance scoring', 'Personalization', 'Authority ranking', 'User engagement analysis'],
      demoAction: () => console.log('Demo ranking')
    },
    {
      id: 'processing',
      title: 'Natural Language Processing',
      description: 'Advanced query understanding with intent recognition and entity extraction.',
      icon: Brain,
      color: 'bg-indigo-500',
      features: ['Intent recognition', 'Entity extraction', 'Query optimization', 'Context understanding'],
      demoAction: () => console.log('Demo NLP')
    }
  ];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-text-primary">AI-Powered Features</h1>
            </div>
            <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
              Discover intelligent document analysis, smart content suggestions, and AI-driven insights 
              that transform how you work with information.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="text-sm">Document Summarization</Badge>
              <Badge variant="secondary" className="text-sm">Smart Tagging</Badge>
              <Badge variant="secondary" className="text-sm">Content Suggestions</Badge>
              <Badge variant="secondary" className="text-sm">Search Ranking</Badge>
              <Badge variant="secondary" className="text-sm">NLP Processing</Badge>
            </div>
          </motion.div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'features' | 'insights' | 'demo')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="demo">Demo</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* AI Capabilities Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary-500" />
                    AI Capabilities Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aiFeatures.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={feature.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                          className="p-4 bg-background-tertiary rounded-lg hover:bg-background-secondary transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="font-semibold text-text-primary">{feature.title}</h3>
                          </div>
                          <p className="text-sm text-text-secondary mb-3">{feature.description}</p>
                          <div className="space-y-1">
                            {feature.features.slice(0, 2).map((feat, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                                <span className="text-xs text-text-muted">{feat}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Benefits Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent-green" />
                    Key Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-accent-green rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary mb-1">Increased Productivity</h4>
                          <p className="text-sm text-text-secondary">
                            Save time with AI-powered document summarization and intelligent content suggestions.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center flex-shrink-0">
                          <Search className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary mb-1">Better Search Results</h4>
                          <p className="text-sm text-text-secondary">
                            Find relevant content faster with AI-powered ranking and personalization.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-accent-purple rounded-lg flex items-center justify-center flex-shrink-0">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary mb-1">Intelligent Insights</h4>
                          <p className="text-sm text-text-secondary">
                            Get actionable recommendations and insights from your content and usage patterns.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-accent-orange rounded-lg flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary mb-1">Continuous Learning</h4>
                          <p className="text-sm text-text-secondary">
                            AI adapts to your preferences and improves recommendations over time.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-6">
                {aiFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-text-primary mb-2">{feature.title}</h3>
                              <p className="text-text-secondary mb-4">{feature.description}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                {feature.features.map((feat, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                                    <span className="text-sm text-text-muted">{feat}</span>
                                  </div>
                                ))}
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={feature.demoAction}
                                disabled={isDemoLoading}
                              >
                                {isDemoLoading ? 'Processing...' : 'Try Demo'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="insights">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <AIInsightsDashboard 
                showExportButton={true}
                refreshInterval={60000}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary-500" />
                    AI Features Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-4 bg-background-tertiary rounded-lg">
                      <h4 className="font-semibold text-text-primary mb-2">Sample Document</h4>
                      <p className="text-sm text-text-secondary mb-3">
                        <strong>Title:</strong> {demoDocument.title}
                      </p>
                      <p className="text-sm text-text-secondary mb-3">
                        <strong>Content:</strong> {demoDocument.content.substring(0, 200)}...
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {demoDocument.tags?.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={handleDemoSummarize}
                        disabled={isDemoLoading}
                      >
                        <FileText className="h-6 w-6" />
                        <span className="font-medium">Summarize Document</span>
                        <span className="text-xs text-text-muted">Generate AI summary</span>
                      </Button>

                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={handleDemoTag}
                        disabled={isDemoLoading}
                      >
                        <Filter className="h-6 w-6" />
                        <span className="font-medium">Tag Content</span>
                        <span className="text-xs text-text-muted">Extract tags & entities</span>
                      </Button>

                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={handleDemoSuggestions}
                        disabled={isDemoLoading}
                      >
                        <Lightbulb className="h-6 w-6" />
                        <span className="font-medium">Get Suggestions</span>
                        <span className="text-xs text-text-muted">AI recommendations</span>
                      </Button>
                    </div>

                    {isDemoLoading && (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-text-muted">
                          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                          Processing with AI...
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
