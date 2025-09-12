import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Search,
  Zap,
  Shield,
  Globe,
  Settings,
  Target,
  Clock,
  Users,
  Calendar,
  Mail,
  MessageSquare,
  Folder,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { userBehaviorTracker } from '@/lib/analytics/UserBehaviorTracker';
import { userPreferencesManager } from '@/lib/analytics/UserPreferences';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'welcome' | 'profile' | 'integrations' | 'preferences' | 'tutorial' | 'completion';
  component: React.ComponentType<any>;
  isRequired: boolean;
  estimatedTime: number; // in minutes
  prerequisites?: string[];
}

export interface OnboardingStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: (data: any) => void;
  isFirst: boolean;
  isLast: boolean;
  progress: number;
}

export interface OnboardingData {
  profile: {
    name: string;
    email: string;
    company: string;
    role: string;
    industry: string;
    teamSize: string;
    goals: string[];
  };
  integrations: {
    selected: string[];
    priority: string[];
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    dataSharing: boolean;
    personalizedContent: boolean;
  };
  tutorial: {
    completedSteps: string[];
    skippedSteps: string[];
  };
}

export interface ComprehensiveOnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
  className?: string;
  userId?: string;
  showProgress?: boolean;
  allowSkipping?: boolean;
  autoAdvance?: boolean;
}

// Welcome Step Component
const WelcomeStep: React.FC<OnboardingStepProps> = ({ onNext, progress: _progress }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center space-y-6"
  >
    <div className="space-y-4">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <Zap className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Welcome to Sphyr</h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Your intelligent search platform that connects all your data sources. 
        Let&apos;s get you set up in just a few minutes.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-6 text-center">
          <Search className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Smart Search</h3>
          <p className="text-sm text-gray-600">
            Find anything across all your connected platforms with AI-powered search
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 text-center">
          <Globe className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Universal Access</h3>
          <p className="text-sm text-gray-600">
            Connect Gmail, Drive, Slack, and more for unified search experience
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Secure & Private</h3>
          <p className="text-sm text-gray-600">
            Enterprise-grade security with complete data privacy and control
          </p>
        </CardContent>
      </Card>
    </div>

    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>~5 minutes</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Join 10,000+ users</span>
        </div>
      </div>
      <Button onClick={onNext} size="lg" className="px-8">
        Get Started
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  </motion.div>
);

// Profile Step Component
const ProfileStep: React.FC<OnboardingStepProps & { data: OnboardingData; onUpdate: (data: Partial<OnboardingData>) => void }> = ({ 
  onNext, onPrevious, isFirst, data, onUpdate 
}) => {
  const [formData, setFormData] = useState(data.profile);

  const handleNext = () => {
    onUpdate({ profile: formData });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Tell us about yourself</h2>
        <p className="text-gray-600">This helps us personalize your experience</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter your full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter your email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
            placeholder="Enter your company name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            placeholder="e.g., Project Manager, Developer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="construction">Construction</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="teamSize">Team Size</Label>
          <Select value={formData.teamSize} onValueChange={(value) => setFormData(prev => ({ ...prev, teamSize: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select team size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 people</SelectItem>
              <SelectItem value="11-50">11-50 people</SelectItem>
              <SelectItem value="51-200">51-200 people</SelectItem>
              <SelectItem value="201-1000">201-1000 people</SelectItem>
              <SelectItem value="1000+">1000+ people</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label>What are your main goals with Sphyr? (Select all that apply)</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            'Find documents faster',
            'Organize team knowledge',
            'Improve collaboration',
            'Reduce information silos',
            'Automate workflows',
            'Gain insights from data'
          ].map(goal => (
            <div key={goal} className="flex items-center space-x-2">
              <Checkbox
                id={goal}
                checked={formData.goals.includes(goal)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData(prev => ({ ...prev, goals: [...prev.goals, goal] }));
                  } else {
                    setFormData(prev => ({ ...prev, goals: prev.goals.filter(g => g !== goal) }));
                  }
                }}
              />
              <Label htmlFor={goal} className="text-sm">{goal}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        {!isFirst && (
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}
        <Button onClick={handleNext} disabled={!formData.name || !formData.email}>
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

// Integrations Step Component
const IntegrationsStep: React.FC<OnboardingStepProps & { data: OnboardingData; onUpdate: (data: Partial<OnboardingData>) => void }> = ({ 
  onNext, onPrevious, isFirst, data, onUpdate 
}) => {
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(data.integrations.selected);
  const [priorityIntegrations, setPriorityIntegrations] = useState<string[]>(data.integrations.priority);

  const integrations = [
    { id: 'gmail', name: 'Gmail', description: 'Search through your emails', icon: Mail, popular: true },
    { id: 'google_drive', name: 'Google Drive', description: 'Find documents and files', icon: Folder, popular: true },
    { id: 'slack', name: 'Slack', description: 'Search team conversations', icon: MessageSquare, popular: true },
    { id: 'calendar', name: 'Google Calendar', description: 'Find events and meetings', icon: Calendar, popular: false },
    { id: 'asana', name: 'Asana', description: 'Search project tasks', icon: Target, popular: false },
    { id: 'outlook', name: 'Outlook', description: 'Search emails and calendar', icon: Mail, popular: false },
    { id: 'onedrive', name: 'OneDrive', description: 'Find Microsoft documents', icon: Folder, popular: false },
    { id: 'quickbooks', name: 'QuickBooks', description: 'Search financial records', icon: BarChart3, popular: false }
  ];

  const handleNext = () => {
    onUpdate({ 
      integrations: { 
        selected: selectedIntegrations, 
        priority: priorityIntegrations 
      } 
    });
    onNext();
  };

  const toggleIntegration = (integrationId: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(integrationId) 
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  const togglePriority = (integrationId: string) => {
    setPriorityIntegrations(prev => 
      prev.includes(integrationId) 
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Connect your data sources</h2>
        <p className="text-gray-600">Choose which platforms you&apos;d like to search across</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map(integration => (
          <Card 
            key={integration.id} 
            className={cn(
              "cursor-pointer transition-all duration-200",
              selectedIntegrations.includes(integration.id) 
                ? "ring-2 ring-primary bg-primary/5" 
                : "hover:shadow-md"
            )}
            onClick={() => toggleIntegration(integration.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <integration.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{integration.name}</h3>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </div>
                </div>
                {integration.popular && (
                  <Badge variant="secondary" className="text-xs">
                    Popular
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedIntegrations.includes(integration.id)}
                    onChange={() => {}} // Handled by card click
                  />
                  <span className="text-sm">Connect</span>
                </div>
                
                {selectedIntegrations.includes(integration.id) && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={priorityIntegrations.includes(integration.id)}
                      onChange={() => togglePriority(integration.id)}
                    />
                    <span className="text-sm">Priority</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedIntegrations.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Pro Tip</h4>
                <p className="text-sm text-blue-800">
                  You can always add or remove integrations later. Priority integrations 
                  will appear first in your search results and get more AI attention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        {!isFirst && (
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}
        <Button onClick={handleNext} disabled={selectedIntegrations.length === 0}>
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

// Preferences Step Component
const PreferencesStep: React.FC<OnboardingStepProps & { data: OnboardingData; onUpdate: (data: Partial<OnboardingData>) => void }> = ({ 
  onNext, onPrevious, isFirst, data, onUpdate 
}) => {
  const [preferences, setPreferences] = useState(data.preferences);

  const handleNext = () => {
    onUpdate({ preferences });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Customize your experience</h2>
        <p className="text-gray-600">Set your preferences to get the most out of Sphyr</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Theme Preference</Label>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { value: 'light', label: 'Light', description: 'Clean and bright' },
              { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
              { value: 'auto', label: 'Auto', description: 'Follow system' }
            ].map(theme => (
              <Card 
                key={theme.value}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  preferences.theme === theme.value 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "hover:shadow-md"
                )}
                onClick={() => setPreferences(prev => ({ ...prev, theme: theme.value as any }))}
              >
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold">{theme.label}</h3>
                  <p className="text-sm text-gray-600">{theme.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-600">Get updates about new features and tips</p>
            </div>
            <Checkbox
              checked={preferences.notifications}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, notifications: !!checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Data Sharing for Analytics</Label>
              <p className="text-sm text-gray-600">Help us improve Sphyr with anonymous usage data</p>
            </div>
            <Checkbox
              checked={preferences.dataSharing}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, dataSharing: !!checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Personalized Content</Label>
              <p className="text-sm text-gray-600">Get AI-powered suggestions based on your usage</p>
            </div>
            <Checkbox
              checked={preferences.personalizedContent}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, personalizedContent: !!checked }))}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        {!isFirst && (
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}
        <Button onClick={handleNext}>
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

// Tutorial Step Component
const TutorialStep: React.FC<OnboardingStepProps & { data: OnboardingData; onUpdate: (data: Partial<OnboardingData>) => void }> = ({ 
  onNext, onPrevious, isFirst, data, onUpdate 
}) => {
  const [currentTutorial, setCurrentTutorial] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>(data.tutorial.completedSteps);

  const tutorials = [
    {
      id: 'search_basics',
      title: 'Basic Search',
      description: 'Learn how to search across your connected platforms',
      icon: Search,
      steps: [
        'Type your search query in the search bar',
        'Use filters to narrow down results',
        'Click on results to view full content'
      ]
    },
    {
      id: 'ai_features',
      title: 'AI-Powered Features',
      description: 'Discover intelligent search and insights',
      icon: Zap,
      steps: [
        'Get AI-generated summaries of search results',
        'Use smart suggestions for better queries',
        'Find related content automatically'
      ]
    },
    {
      id: 'integrations',
      title: 'Managing Integrations',
      description: 'Connect and manage your data sources',
      icon: Settings,
      steps: [
        'Add new integrations from the settings',
        'Set priority for important sources',
        'Monitor connection health and sync status'
      ]
    }
  ];

  const handleNext = () => {
    onUpdate({ 
      tutorial: { 
        completedSteps: completedTutorials, 
        skippedSteps: tutorials.filter(t => !completedTutorials.includes(t.id)).map(t => t.id)
      } 
    });
    onNext();
  };

  const markTutorialComplete = (tutorialId: string) => {
    if (!completedTutorials.includes(tutorialId)) {
      setCompletedTutorials(prev => [...prev, tutorialId]);
    }
  };

  const currentTutorialData = tutorials[currentTutorial];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Quick Tutorial</h2>
        <p className="text-gray-600">Learn the basics of using Sphyr effectively</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          {tutorials.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                index === currentTutorial 
                  ? "bg-primary" 
                  : index < currentTutorial 
                    ? "bg-green-500" 
                    : "bg-gray-300"
              )}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <currentTutorialData.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>{currentTutorialData.title}</CardTitle>
                <p className="text-gray-600">{currentTutorialData.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentTutorialData.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-primary">{index + 1}</span>
                  </div>
                  <p className="text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentTutorial(Math.max(0, currentTutorial - 1))}
            disabled={currentTutorial === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={() => {
              markTutorialComplete(currentTutorialData.id);
              if (currentTutorial < tutorials.length - 1) {
                setCurrentTutorial(currentTutorial + 1);
              }
            }}
          >
            {currentTutorial < tutorials.length - 1 ? (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Complete
                <CheckCircle className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex justify-between">
        {!isFirst && (
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}
        <Button onClick={handleNext}>
          {isFirst ? 'Skip Tutorial' : 'Next'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

// Completion Step Component
const CompletionStep: React.FC<OnboardingStepProps & { data: OnboardingData }> = ({ 
  onComplete, onPrevious: _onPrevious, isFirst: _isFirst, data 
}) => {
  const handleComplete = () => {
    // Track onboarding completion
    userBehaviorTracker.trackEvent('click', {
      element: 'onboarding_complete_button',
      action: 'onboarding_complete',
      profile: data.profile,
      integrationsCount: data.integrations.selected.length,
      preferences: data.preferences,
      tutorialCompleted: data.tutorial.completedSteps.length
    });

    // Save user preferences
    if (data.profile.email) {
      userPreferencesManager.updatePreference(data.profile.email, 'theme', data.preferences.theme);
      userPreferencesManager.updatePreference(data.profile.email, 'notifications.email', data.preferences.notifications);
      userPreferencesManager.updatePreference(data.profile.email, 'privacy.dataSharingConsent', data.preferences.dataSharing);
      userPreferencesManager.updatePreference(data.profile.email, 'privacy.personalizedContent', data.preferences.personalizedContent);
    }

    onComplete(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle className="w-10 h-10 text-green-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900">You&apos;re all set!</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Welcome to Sphyr! You&apos;re ready to start searching across all your connected platforms.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Connected Integrations</h3>
            <p className="text-2xl font-bold text-primary">{data.integrations.selected.length}</p>
            <p className="text-sm text-gray-600">platforms ready to search</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Goals Set</h3>
            <p className="text-2xl font-bold text-primary">{data.profile.goals.length}</p>
            <p className="text-sm text-gray-600">objectives to achieve</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">What&apos;s next?</h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left max-w-md mx-auto">
            <li>• Start searching across your connected platforms</li>
            <li>• Explore AI-powered insights and suggestions</li>
            <li>• Set up additional integrations as needed</li>
            <li>• Customize your search preferences</li>
          </ul>
        </div>
        
        <Button onClick={handleComplete} size="lg" className="px-8">
          Start Using Sphyr
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

// Main Onboarding Flow Component
export const ComprehensiveOnboardingFlow: React.FC<ComprehensiveOnboardingFlowProps> = ({
  onComplete,
  onSkip,
  className = "",
  userId,
  showProgress = true,
  allowSkipping = true,
  autoAdvance: _autoAdvance = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    profile: {
      name: '',
      email: '',
      company: '',
      role: '',
      industry: '',
      teamSize: '',
      goals: []
    },
    integrations: {
      selected: [],
      priority: []
    },
    preferences: {
      theme: 'auto',
      notifications: true,
      dataSharing: true,
      personalizedContent: true
    },
    tutorial: {
      completedSteps: [],
      skippedSteps: []
    }
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Get started with Sphyr',
      type: 'welcome',
      component: WelcomeStep,
      isRequired: true,
      estimatedTime: 1
    },
    {
      id: 'profile',
      title: 'Profile Setup',
      description: 'Tell us about yourself',
      type: 'profile',
      component: ProfileStep,
      isRequired: true,
      estimatedTime: 2
    },
    {
      id: 'integrations',
      title: 'Connect Integrations',
      description: 'Link your data sources',
      type: 'integrations',
      component: IntegrationsStep,
      isRequired: true,
      estimatedTime: 3
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your experience',
      type: 'preferences',
      component: PreferencesStep,
      isRequired: false,
      estimatedTime: 1
    },
    {
      id: 'tutorial',
      title: 'Tutorial',
      description: 'Learn the basics',
      type: 'tutorial',
      component: TutorialStep,
      isRequired: false,
      estimatedTime: 2
    },
    {
      id: 'completion',
      title: 'Complete',
      description: 'You\'re all set!',
      type: 'completion',
      component: CompletionStep,
      isRequired: true,
      estimatedTime: 1
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const totalEstimatedTime = steps.reduce((total, step) => total + step.estimatedTime, 0);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    if (allowSkipping) {
      onSkip();
    }
  }, [allowSkipping, onSkip]);

  const handleComplete = useCallback((data: OnboardingData) => {
    onComplete(data);
  }, [onComplete]);

  const updateOnboardingData = useCallback((updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  }, []);

  // Track onboarding start
  useEffect(() => {
    userBehaviorTracker.trackEvent('page_view', {
      path: '/onboarding',
      action: 'onboarding_start',
      userId,
      stepCount: steps.length,
      estimatedTime: totalEstimatedTime
    });
  }, [userId, steps.length, totalEstimatedTime]);

  // Track step changes
  useEffect(() => {
    userBehaviorTracker.trackEvent('click', {
      element: 'onboarding_step',
      action: 'step_change',
      stepId: currentStepData.id,
      stepIndex: currentStep,
      stepType: currentStepData.type
    });
  }, [currentStep, currentStepData.id, currentStepData.type]);

  const CurrentStepComponent = currentStepData.component as React.ComponentType<any>;

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">Sphyr Onboarding</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {showProgress && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <div className="w-32">
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              )}
              
              {allowSkipping && (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  <X className="w-4 h-4 mr-2" />
                  Skip
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <CurrentStepComponent
            key={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onComplete={handleComplete}
            isFirst={currentStep === 0}
            isLast={currentStep === steps.length - 1}
            progress={progress}
            data={onboardingData}
            onUpdate={updateOnboardingData}
          />
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>~{totalEstimatedTime} minutes total</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Secure & Private</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>Need help?</span>
              <Button variant="link" size="sm" className="p-0 h-auto">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveOnboardingFlow;
