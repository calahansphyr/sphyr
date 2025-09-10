/**
 * Feature flags configuration
 * Controls which features are enabled/disabled in the application
 */

export interface FeatureFlags {
  // Core features
  search: boolean;
  integrations: boolean;
  ai: boolean;
  
  // Integration-specific features
  googleWorkspace: boolean;
  constructionIntegrations: boolean;
  projectManagement: boolean;
  businessTools: boolean;
  
  // AI features
  queryProcessing: boolean;
  resultRanking: boolean;
  contextBuilding: boolean;
  
  // UI features
  darkMode: boolean;
  advancedSearch: boolean;
  searchHistory: boolean;
  analytics: boolean;
  
  // Development features
  debugMode: boolean;
  mockIntegrations: boolean;
  performanceMonitoring: boolean;
}

export const featuresConfig: FeatureFlags = {
  // Core features
  search: process.env.FEATURE_SEARCH !== 'false',
  integrations: process.env.FEATURE_INTEGRATIONS !== 'false',
  ai: process.env.FEATURE_AI !== 'false',
  
  // Integration-specific features
  googleWorkspace: process.env.FEATURE_GOOGLE_WORKSPACE !== 'false',
  constructionIntegrations: process.env.FEATURE_CONSTRUCTION_INTEGRATIONS !== 'false',
  projectManagement: process.env.FEATURE_PROJECT_MANAGEMENT !== 'false',
  businessTools: process.env.FEATURE_BUSINESS_TOOLS !== 'false',
  
  // AI features
  queryProcessing: process.env.FEATURE_AI_QUERY_PROCESSING !== 'false',
  resultRanking: process.env.FEATURE_AI_RESULT_RANKING !== 'false',
  contextBuilding: process.env.FEATURE_AI_CONTEXT_BUILDING !== 'false',
  
  // UI features
  darkMode: process.env.FEATURE_DARK_MODE !== 'false',
  advancedSearch: process.env.FEATURE_ADVANCED_SEARCH !== 'false',
  searchHistory: process.env.FEATURE_SEARCH_HISTORY !== 'false',
  analytics: process.env.FEATURE_ANALYTICS !== 'false',
  
  // Development features
  debugMode: process.env.FEATURE_DEBUG_MODE === 'true',
  mockIntegrations: process.env.FEATURE_MOCK_INTEGRATIONS === 'true',
  performanceMonitoring: process.env.FEATURE_PERFORMANCE_MONITORING !== 'false',
};
