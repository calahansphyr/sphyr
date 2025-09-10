/**
 * Core constants for the Sphyr application
 * Centralized configuration values and application-wide constants
 */

// Application Configuration
export const APP_CONFIG = {
  name: 'Sphyr',
  description: 'AI-powered search tool that connects to all your business applications',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
  debounceMs: 300,
  minQueryLength: 2,
  maxResults: 50,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
} as const;

// Integration Configuration
export const INTEGRATION_CONFIG = {
  supportedProviders: [
    'google',
    'slack',
    'asana',
    'quickbooks',
    'construction',
  ] as const,
  maxIntegrationsPerUser: 20,
} as const;

// UI Configuration
export const UI_CONFIG = {
  animationDuration: 200,
  toastDuration: 5000,
  modalBackdropBlur: 'backdrop-blur-sm',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection and try again.',
  unauthorized: 'You are not authorized to perform this action.',
  notFound: 'The requested resource was not found.',
  serverError: 'An unexpected server error occurred. Please try again later.',
  validation: 'Please check your input and try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  saved: 'Changes saved successfully.',
  deleted: 'Item deleted successfully.',
  connected: 'Integration connected successfully.',
  disconnected: 'Integration disconnected successfully.',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  enableAdvancedSearch: true,
  enableSearchHistory: true,
  enableIntegrations: true,
  enableAnalytics: true,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  authToken: 'sphyr_auth_token',
  refreshToken: 'sphyr_refresh_token',
  userPreferences: 'sphyr_user_preferences',
  searchHistory: 'sphyr_search_history',
  theme: 'sphyr_theme',
} as const;

// Route Paths
export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  search: '/search',
  integrations: '/integrations',
  settings: '/settings',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    callback: '/auth/callback',
  },
} as const;
