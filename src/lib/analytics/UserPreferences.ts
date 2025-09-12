import { UserProfile } from './UserBehaviorTracker';

export interface UserPreferences {
  // UI Preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  
  // Search Preferences
  search: {
    defaultFilters: string[];
    preferredIntegrations: string[];
    autoSuggestions: boolean;
    searchHistory: boolean;
    personalizedResults: boolean;
  };
  
  // Notification Preferences
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    searchAlerts: boolean;
    integrationUpdates: boolean;
    weeklyDigest: boolean;
  };
  
  // Accessibility Preferences
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
  };
  
  // Privacy Preferences
  privacy: {
    analytics: boolean;
    personalization: boolean;
    dataRetention: number; // days
    shareUsageData: boolean;
  };
  
  // Performance Preferences
  performance: {
    cacheResults: boolean;
    preloadIntegrations: boolean;
    backgroundSync: boolean;
    offlineMode: boolean;
  };
}

export interface PreferenceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  preferences: PreferenceItem[];
}

export interface PreferenceItem {
  id: string;
  name: string;
  description: string;
  type: 'boolean' | 'select' | 'multiselect' | 'number' | 'text';
  value: unknown;
  options?: { label: string; value: unknown }[];
  category: string;
  required: boolean;
  advanced: boolean;
}

class UserPreferencesManager {
  private preferences: Map<string, UserPreferences> = new Map();
  private defaultPreferences: UserPreferences;

  constructor() {
    this.defaultPreferences = this.getDefaultPreferences();
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'auto',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      search: {
        defaultFilters: [],
        preferredIntegrations: [],
        autoSuggestions: true,
        searchHistory: true,
        personalizedResults: true
      },
      
      notifications: {
        email: true,
        push: true,
        inApp: true,
        searchAlerts: false,
        integrationUpdates: true,
        weeklyDigest: true
      },
      
      accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        screenReader: false,
        keyboardNavigation: true
      },
      
      privacy: {
        analytics: true,
        personalization: true,
        dataRetention: 365,
        shareUsageData: false
      },
      
      performance: {
        cacheResults: true,
        preloadIntegrations: false,
        backgroundSync: true,
        offlineMode: false
      }
    };
  }

  public getUserPreferences(userId: string): UserPreferences {
    const preferences = this.preferences.get(userId);
    if (!preferences) {
      const defaultPrefs = { ...this.defaultPreferences };
      this.preferences.set(userId, defaultPrefs);
      return defaultPrefs;
    }
    return preferences;
  }

  public updateUserPreferences(userId: string, updates: Partial<UserPreferences>): UserPreferences {
    const currentPreferences = this.getUserPreferences(userId);
    const updatedPreferences = this.deepMerge(currentPreferences, updates);
    this.preferences.set(userId, updatedPreferences);
    
    // Persist to localStorage
    this.persistPreferences(userId, updatedPreferences);
    
    // Apply preferences to the UI
    this.applyPreferences(updatedPreferences);
    
    return updatedPreferences;
  }

  public updatePreference(userId: string, path: string, value: unknown): UserPreferences {
    const currentPreferences = this.getUserPreferences(userId);
    const updatedPreferences = this.setNestedValue(currentPreferences, path, value);
    this.preferences.set(userId, updatedPreferences);
    
    this.persistPreferences(userId, updatedPreferences);
    this.applyPreferences(updatedPreferences);
    
    return updatedPreferences;
  }

  public resetPreferences(userId: string): UserPreferences {
    const defaultPreferences = { ...this.defaultPreferences };
    this.preferences.set(userId, defaultPreferences);
    
    this.persistPreferences(userId, defaultPreferences);
    this.applyPreferences(defaultPreferences);
    
    return defaultPreferences;
  }

  public exportPreferences(userId: string): string {
    const preferences = this.getUserPreferences(userId);
    return JSON.stringify(preferences, null, 2);
  }

  public importPreferences(userId: string, preferencesJson: string): UserPreferences {
    try {
      const importedPreferences = JSON.parse(preferencesJson);
      const validatedPreferences = this.validatePreferences(importedPreferences);
      
      this.preferences.set(userId, validatedPreferences);
      this.persistPreferences(userId, validatedPreferences);
      this.applyPreferences(validatedPreferences);
      
      return validatedPreferences;
    } catch {
      throw new Error('Invalid preferences format');
    }
  }

  public getPreferenceCategories(): PreferenceCategory[] {
    return [
      {
        id: 'appearance',
        name: 'Appearance',
        description: 'Customize the look and feel of the application',
        icon: 'palette',
        preferences: [
          {
            id: 'theme',
            name: 'Theme',
            description: 'Choose your preferred color theme',
            type: 'select',
            value: 'auto',
            options: [
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'Auto', value: 'auto' }
            ],
            category: 'appearance',
            required: true,
            advanced: false
          },
          {
            id: 'language',
            name: 'Language',
            description: 'Select your preferred language',
            type: 'select',
            value: 'en',
            options: [
              { label: 'English', value: 'en' },
              { label: 'Spanish', value: 'es' },
              { label: 'French', value: 'fr' },
              { label: 'German', value: 'de' },
              { label: 'Italian', value: 'it' },
              { label: 'Portuguese', value: 'pt' },
              { label: 'Japanese', value: 'ja' },
              { label: 'Korean', value: 'ko' },
              { label: 'Chinese', value: 'zh' },
              { label: 'Arabic', value: 'ar' }
            ],
            category: 'appearance',
            required: true,
            advanced: false
          }
        ]
      },
      {
        id: 'search',
        name: 'Search',
        description: 'Configure your search experience',
        icon: 'search',
        preferences: [
          {
            id: 'autoSuggestions',
            name: 'Auto Suggestions',
            description: 'Show search suggestions as you type',
            type: 'boolean',
            value: true,
            category: 'search',
            required: false,
            advanced: false
          },
          {
            id: 'searchHistory',
            name: 'Search History',
            description: 'Remember your search history',
            type: 'boolean',
            value: true,
            category: 'search',
            required: false,
            advanced: false
          },
          {
            id: 'personalizedResults',
            name: 'Personalized Results',
            description: 'Show personalized search results based on your usage',
            type: 'boolean',
            value: true,
            category: 'search',
            required: false,
            advanced: false
          }
        ]
      },
      {
        id: 'notifications',
        name: 'Notifications',
        description: 'Manage your notification preferences',
        icon: 'bell',
        preferences: [
          {
            id: 'email',
            name: 'Email Notifications',
            description: 'Receive notifications via email',
            type: 'boolean',
            value: true,
            category: 'notifications',
            required: false,
            advanced: false
          },
          {
            id: 'push',
            name: 'Push Notifications',
            description: 'Receive push notifications',
            type: 'boolean',
            value: true,
            category: 'notifications',
            required: false,
            advanced: false
          },
          {
            id: 'inApp',
            name: 'In-App Notifications',
            description: 'Show notifications within the application',
            type: 'boolean',
            value: true,
            category: 'notifications',
            required: false,
            advanced: false
          }
        ]
      },
      {
        id: 'accessibility',
        name: 'Accessibility',
        description: 'Configure accessibility features',
        icon: 'accessibility',
        preferences: [
          {
            id: 'highContrast',
            name: 'High Contrast',
            description: 'Use high contrast colors for better visibility',
            type: 'boolean',
            value: false,
            category: 'accessibility',
            required: false,
            advanced: false
          },
          {
            id: 'largeText',
            name: 'Large Text',
            description: 'Use larger text sizes',
            type: 'boolean',
            value: false,
            category: 'accessibility',
            required: false,
            advanced: false
          },
          {
            id: 'reducedMotion',
            name: 'Reduce Motion',
            description: 'Minimize animations and transitions',
            type: 'boolean',
            value: false,
            category: 'accessibility',
            required: false,
            advanced: false
          }
        ]
      },
      {
        id: 'privacy',
        name: 'Privacy',
        description: 'Control your privacy settings',
        icon: 'shield',
        preferences: [
          {
            id: 'analytics',
            name: 'Analytics',
            description: 'Allow analytics data collection',
            type: 'boolean',
            value: true,
            category: 'privacy',
            required: false,
            advanced: false
          },
          {
            id: 'personalization',
            name: 'Personalization',
            description: 'Enable personalized features',
            type: 'boolean',
            value: true,
            category: 'privacy',
            required: false,
            advanced: false
          },
          {
            id: 'dataRetention',
            name: 'Data Retention',
            description: 'How long to keep your data (in days)',
            type: 'number',
            value: 365,
            category: 'privacy',
            required: false,
            advanced: true
          }
        ]
      },
      {
        id: 'performance',
        name: 'Performance',
        description: 'Optimize application performance',
        icon: 'speed',
        preferences: [
          {
            id: 'cacheResults',
            name: 'Cache Results',
            description: 'Cache search results for faster access',
            type: 'boolean',
            value: true,
            category: 'performance',
            required: false,
            advanced: true
          },
          {
            id: 'preloadIntegrations',
            name: 'Preload Integrations',
            description: 'Preload integration data for faster searches',
            type: 'boolean',
            value: false,
            category: 'performance',
            required: false,
            advanced: true
          },
          {
            id: 'backgroundSync',
            name: 'Background Sync',
            description: 'Sync data in the background',
            type: 'boolean',
            value: true,
            category: 'performance',
            required: false,
            advanced: true
          }
        ]
      }
    ];
  }

  private deepMerge(target: UserPreferences, source: Partial<UserPreferences>): UserPreferences {
    const result = { ...target };
    
    if (source.theme !== undefined) result.theme = source.theme;
    if (source.language !== undefined) result.language = source.language;
    if (source.timezone !== undefined) result.timezone = source.timezone;
    
    if (source.search) {
      result.search = { ...target.search, ...source.search };
    }
    
    if (source.notifications) {
      result.notifications = { ...target.notifications, ...source.notifications };
    }
    
    if (source.accessibility) {
      result.accessibility = { ...target.accessibility, ...source.accessibility };
    }
    
    if (source.privacy) {
      result.privacy = { ...target.privacy, ...source.privacy };
    }
    
    if (source.performance) {
      result.performance = { ...target.performance, ...source.performance };
    }
    
    return result;
  }

  private setNestedValue(obj: UserPreferences, path: string, value: unknown): UserPreferences {
    const result = { ...obj };
    const keys = path.split('.');
    
    if (keys.length === 1) {
      // Simple property update
      (result as Record<string, unknown>)[keys[0]] = value;
    } else if (keys.length === 2) {
      // Nested property update
      const [parent, child] = keys;
      if (parent === 'search' && result.search) {
        result.search = { ...result.search, [child]: value };
      } else if (parent === 'notifications' && result.notifications) {
        result.notifications = { ...result.notifications, [child]: value };
      } else if (parent === 'accessibility' && result.accessibility) {
        result.accessibility = { ...result.accessibility, [child]: value };
      } else if (parent === 'privacy' && result.privacy) {
        result.privacy = { ...result.privacy, [child]: value };
      } else if (parent === 'performance' && result.performance) {
        result.performance = { ...result.performance, [child]: value };
      }
    }
    
    return result;
  }

  private validatePreferences(preferences: Record<string, unknown>): UserPreferences {
    // Basic validation - in a real application, you'd use a schema validator
    const validated = { ...this.defaultPreferences };
    
    if (preferences.theme && ['light', 'dark', 'auto'].includes(preferences.theme as string)) {
      validated.theme = preferences.theme as 'light' | 'dark' | 'auto';
    }
    
    if (preferences.language && typeof preferences.language === 'string') {
      validated.language = preferences.language as string;
    }
    
    if (preferences.timezone && typeof preferences.timezone === 'string') {
      validated.timezone = preferences.timezone as string;
    }
    
    // Validate nested objects
    if (preferences.search && typeof preferences.search === 'object') {
      validated.search = { ...validated.search, ...(preferences.search as Record<string, unknown>) };
    }
    
    if (preferences.notifications && typeof preferences.notifications === 'object') {
      validated.notifications = { ...validated.notifications, ...(preferences.notifications as Record<string, unknown>) };
    }
    
    if (preferences.accessibility && typeof preferences.accessibility === 'object') {
      validated.accessibility = { ...validated.accessibility, ...(preferences.accessibility as Record<string, unknown>) };
    }
    
    if (preferences.privacy && typeof preferences.privacy === 'object') {
      validated.privacy = { ...validated.privacy, ...(preferences.privacy as Record<string, unknown>) };
    }
    
    if (preferences.performance && typeof preferences.performance === 'object') {
      validated.performance = { ...validated.performance, ...(preferences.performance as Record<string, unknown>) };
    }
    
    return validated;
  }

  private persistPreferences(userId: string, preferences: UserPreferences): void {
    try {
      localStorage.setItem(`user_preferences_${userId}`, JSON.stringify(preferences));
    } catch {
      console.error('Failed to persist preferences');
    }
  }

  private loadPreferences(userId: string): UserPreferences | null {
    try {
      const stored = localStorage.getItem(`user_preferences_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      console.error('Failed to load preferences');
    }
    return null;
  }

  private applyPreferences(preferences: UserPreferences): void {
    // Apply theme
    document.documentElement.setAttribute('data-theme', preferences.theme);
    
    // Apply language
    document.documentElement.setAttribute('lang', preferences.language);
    
    // Apply accessibility preferences
    if (preferences.accessibility.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    if (preferences.accessibility.largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
    
    if (preferences.accessibility.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }

  public initializeUserPreferences(userId: string): UserPreferences {
    // Try to load from localStorage first
    const storedPreferences = this.loadPreferences(userId);
    if (storedPreferences) {
      const validatedPreferences = this.validatePreferences(storedPreferences as unknown as Record<string, unknown>);
      this.preferences.set(userId, validatedPreferences);
      this.applyPreferences(validatedPreferences);
      return validatedPreferences;
    }
    
    // Use default preferences
    const defaultPreferences = { ...this.defaultPreferences };
    this.preferences.set(userId, defaultPreferences);
    this.persistPreferences(userId, defaultPreferences);
    this.applyPreferences(defaultPreferences);
    
    return defaultPreferences;
  }

  public getUserProfile(userId: string): UserProfile {
    const preferences = this.getUserPreferences(userId);
    
    return {
      userId,
      preferences: {
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        notifications: preferences.notifications.inApp,
        accessibility: {
          highContrast: preferences.accessibility.highContrast,
          largeText: preferences.accessibility.largeText,
          reducedMotion: preferences.accessibility.reducedMotion
        }
      },
      behavior: {
        searchPatterns: [],
        frequentlyUsedIntegrations: preferences.search.preferredIntegrations,
        preferredSearchFilters: preferences.search.defaultFilters,
        averageSessionDuration: 0,
        totalSearches: 0,
        lastActive: Date.now()
      },
      recommendations: {
        suggestedIntegrations: [],
        searchSuggestions: [],
        personalizedFilters: []
      }
    };
  }
}

// Singleton instance
export const userPreferencesManager = new UserPreferencesManager();

export default userPreferencesManager;
