import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Globe, 
  Settings, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle,
  Sparkles,
  Zap,
  Shield,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OnboardingStepProps } from '@/context/OnboardingContext';
import { cn } from '@/lib/utils';

// Step 1: Welcome & Profile Setup
export const WelcomeStep: React.FC<OnboardingStepProps> = ({
  onNext,
  data,
  onUpdate,
  isFirst: _isFirst,
  progress: _progress
}) => {
  const [formData, setFormData] = useState({
    name: data.profile.name || '',
    email: data.profile.email || '',
    company: data.profile.company || '',
    role: data.profile.role || ''
  });

  const handleNext = () => {
    onUpdate({
      profile: {
        ...data.profile,
        ...formData
      }
    });
    onNext();
  };

  const isFormValid = formData.name.trim() && formData.email.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Sparkles className="h-10 w-10 text-white" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          Welcome to Sphyr! 🎉
        </h1>
        <p className="text-lg text-text-secondary mb-8">
          Let&apos;s get you set up in just a few minutes. First, tell us a bit about yourself.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Your company name"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleNext}
          disabled={!isFormValid}
          className="px-8"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// Step 2: Integration Selection
export const IntegrationsStep: React.FC<OnboardingStepProps> = ({
  onNext,
  onPrevious,
  data,
  onUpdate,
  isFirst: _isFirst,
  isLast: _isLast,
  progress: _progress
}) => {
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(
    data.integrations.selected || []
  );

  const availableIntegrations = [
    { id: 'google', name: 'Google Workspace', description: 'Gmail, Drive, Docs, Sheets', icon: '🔍' },
    { id: 'notion', name: 'Notion', description: 'Notes, databases, wikis', icon: '📝' },
    { id: 'slack', name: 'Slack', description: 'Team communication', icon: '💬' },
    { id: 'github', name: 'GitHub', description: 'Code repositories', icon: '💻' },
    { id: 'confluence', name: 'Confluence', description: 'Documentation', icon: '📚' },
    { id: 'jira', name: 'Jira', description: 'Project management', icon: '🎯' }
  ];

  const handleIntegrationToggle = (integrationId: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(integrationId)
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  const handleNext = () => {
    onUpdate({
      integrations: {
        ...data.integrations,
        selected: selectedIntegrations
      }
    });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Globe className="h-10 w-10 text-white" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          Connect Your Tools
        </h1>
        <p className="text-lg text-text-secondary mb-8">
          Choose which platforms you&apos;d like to search across. You can always add more later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {availableIntegrations.map((integration) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * availableIntegrations.indexOf(integration) }}
          >
            <Card 
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                selectedIntegrations.includes(integration.id)
                  ? "ring-2 ring-primary-500 bg-primary-50"
                  : "hover:bg-muted/50"
              )}
              onClick={() => handleIntegrationToggle(integration.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{integration.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{integration.name}</h3>
                      {selectedIntegrations.includes(integration.id) && (
                        <CheckCircle className="h-4 w-4 text-primary-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {selectedIntegrations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-primary-50 border-primary-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary-500" />
                <span className="font-medium text-primary-700">
                  Great choice! You&apos;ve selected {selectedIntegrations.length} integration{selectedIntegrations.length !== 1 ? 's' : ''}.
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={_isFirst}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button onClick={handleNext} className="px-8">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// Step 3: Preferences & Completion
export const PreferencesStep: React.FC<OnboardingStepProps> = ({
  onNext: _onNext,
  onPrevious,
  onComplete,
  data,
  onUpdate,
  isFirst: _isFirst,
  isLast: _isLast,
  progress: _progress
}) => {
  const [preferences, setPreferences] = useState({
    theme: data.preferences.theme,
    notifications: data.preferences.notifications,
    dataSharing: data.preferences.dataSharing
  });

  const handleComplete = () => {
    onUpdate({
      preferences: {
        ...data.preferences,
        ...preferences
      }
    });
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 bg-accent-purple rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Settings className="h-10 w-10 text-white" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          Almost Done! 🎯
        </h1>
        <p className="text-lg text-text-secondary mb-8">
          Just a few quick preferences to personalize your experience.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={preferences.theme} onValueChange={(value: string) => setPreferences(prev => ({ ...prev, theme: value as 'light' | 'dark' | 'system' }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto (System)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get updates about your searches and insights
                </p>
              </div>
              <Checkbox
                checked={preferences.notifications}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, notifications: !!checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Data Sharing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help improve Sphyr with anonymous usage data
                </p>
              </div>
              <Checkbox
                checked={preferences.dataSharing}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, dataSharing: !!checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={_isFirst}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button onClick={handleComplete} className="px-8 bg-accent-green hover:bg-accent-green/90">
          <CheckCircle className="mr-2 h-4 w-4" />
          Complete Setup
        </Button>
      </div>
    </motion.div>
  );
};
