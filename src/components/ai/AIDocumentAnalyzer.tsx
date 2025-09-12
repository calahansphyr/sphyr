import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  FileText,
  Tag,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  MapPin,
  Calendar,
  BarChart3,
  Eye,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  Target,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { advancedAI, DocumentAnalysis } from '@/lib/ai/AdvancedAI';

interface AIDocumentAnalyzerProps {
  documentId: string;
  content: string;
  metadata?: Record<string, unknown>;
  onAnalysisComplete?: (analysis: DocumentAnalysis) => void;
  className?: string;
}

export const AIDocumentAnalyzer: React.FC<AIDocumentAnalyzerProps> = ({
  documentId,
  content,
  metadata = {},
  onAnalysisComplete,
  className = ""
}) => {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  const analyzeDocument = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await advancedAI.analyzeDocument(documentId, content, metadata);
      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze document');
    } finally {
      setLoading(false);
    }
  }, [documentId, content, metadata, onAnalysisComplete]);

  useEffect(() => {
    if (content && documentId) {
      analyzeDocument();
    }
  }, [analyzeDocument, content, documentId]);

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <CheckCircle className="w-4 h-4" />;
      case 'negative': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <BarChart3 className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'anomaly': return <AlertTriangle className="w-4 h-4" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: string): string => {
    switch (type) {
      case 'pattern': return 'text-blue-600 bg-blue-50';
      case 'trend': return 'text-green-600 bg-green-50';
      case 'anomaly': return 'text-red-600 bg-red-50';
      case 'recommendation': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Document Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Analyzing document with AI...</span>
              </div>
              <Progress value={75} className="w-full" />
              <p className="text-sm text-gray-500">
                Extracting insights, generating tags, and analyzing content
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Analysis Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={analyzeDocument} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Document Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{analysis.summary.wordCount}</div>
              <div className="text-sm text-gray-600">Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{analysis.summary.readingTime}</div>
              <div className="text-sm text-gray-600">Min Read</div>
            </div>
            <div className="text-center">
              <div className={cn("text-2xl font-bold", 
                analysis.sentiment.overall === 'positive' ? 'text-green-600' :
                analysis.sentiment.overall === 'negative' ? 'text-red-600' : 'text-gray-600'
              )}>
                {Math.round(analysis.sentiment.scores.overall * 100)}%
              </div>
              <div className="text-sm text-gray-600">Sentiment</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <p className="text-gray-700 leading-relaxed">{analysis.summary.summary}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Key Points</h4>
                  <ul className="space-y-1">
                    {analysis.summary.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-4">
                  <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-sm", getSentimentColor(analysis.sentiment.overall))}>
                    {getSentimentIcon(analysis.sentiment.overall)}
                    <span className="capitalize">{analysis.sentiment.overall}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Confidence: {Math.round(analysis.summary.confidence * 100)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Readability Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Readability Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Readability Score</span>
                  <span className="text-sm text-gray-600">{analysis.readability.score}/100</span>
                </div>
                <Progress value={analysis.readability.score} className="w-full" />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {analysis.readability.level} Level
                  </Badge>
                </div>
                {analysis.readability.suggestions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Suggestions</h5>
                    <ul className="space-y-1">
                      {analysis.readability.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Smart Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['topic', 'entity', 'sentiment', 'action', 'priority'].map(category => {
                  const categoryTags = analysis.tags.filter(tag => tag.category === category);
                  if (categoryTags.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h4 className="font-medium text-gray-900 mb-2 capitalize">{category} Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {categoryTags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="flex items-center gap-1"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            {tag.name}
                            <span className="text-xs opacity-75">
                              {Math.round(tag.confidence * 100)}%
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.suggestions.map(suggestion => (
                  <div key={suggestion.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.insights.map(insight => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", getInsightColor(insight.type))}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(insight.impact)}>
                              {insight.impact} impact
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {Math.round(insight.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                          {insight.actionable && (
                            <Badge variant="default" className="text-xs">
                              <Target className="w-3 h-3 mr-1" />
                              Actionable
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entities Tab */}
        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Extracted Entities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    People
                  </h4>
                  <div className="space-y-2">
                    {analysis.entities.people.map((person, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        {person}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Locations
                  </h4>
                  <div className="space-y-2">
                    {analysis.entities.locations.map((location, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        {location}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Organizations
                  </h4>
                  <div className="space-y-2">
                    {analysis.entities.organizations.map((org, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        {org}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Dates
                  </h4>
                  <div className="space-y-2">
                    {analysis.entities.dates.map((date, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        {date}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button onClick={analyzeDocument} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Re-analyze
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Analysis
        </Button>
        <Button variant="outline">
          <Share2 className="w-4 h-4 mr-2" />
          Share Results
        </Button>
      </div>
    </div>
  );
};

export default AIDocumentAnalyzer;
