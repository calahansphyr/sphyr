export { default as userBehaviorTracker, useAnalytics, usePageTracking } from './UserBehaviorTracker';
export type { UserEvent, UserSession, UserProfile } from './UserBehaviorTracker';

export { default as recommendationEngine } from './RecommendationEngine';
export type { Recommendation, RecommendationContext } from './RecommendationEngine';

export { default as userPreferencesManager } from './UserPreferences';
export type { UserPreferences, PreferenceCategory, PreferenceItem } from './UserPreferences';
