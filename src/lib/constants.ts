/**
 * Application Constants
 * Centralized location for all magic numbers and configuration values
 */

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  // UI timeouts
  MESSAGE_DISPLAY_DURATION: 5000, // 5 seconds
  DEBOUNCE_DELAY: 300, // 300ms
  SEARCH_DEBOUNCE_DELAY: 500, // 500ms
  
  // Cache TTL values
  SEARCH_RANKING_CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
  QUERY_PROCESSING_CACHE_TTL: 60 * 60 * 1000, // 1 hour
  DOCUMENT_SUMMARY_CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  CONTENT_TAGGING_CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  CONTENT_SUGGESTIONS_CACHE_TTL: 2 * 60 * 60 * 1000, // 2 hours
  API_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MEMOIZATION_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  
  // Performance thresholds
  CLEANUP_INTERVAL: 60 * 1000, // 1 minute
  MILLISECONDS_PER_DAY: 1000 * 60 * 60 * 24, // 1 day in milliseconds
} as const;

// Content length limits
export const CONTENT_LIMITS = {
  MAX_QUERY_LENGTH: 500,
  MAX_REASON_LENGTH: 500,
  MAX_CONTENT_PREVIEW_LENGTH: 500,
  MAX_WORD_COUNT_FOR_AUTHORITY: 500,
  MAX_WORD_COUNT_FOR_QUALITY: 200,
  MAX_WORD_COUNT_FOR_EXTENDED_QUALITY: 1000,
} as const;

// Storage limits
export const STORAGE_LIMITS = {
  MAX_RANKINGS: 1000,
  MAX_ITEMS: 1000,
  MAX_CACHE_SIZE: 100,
  MAX_STORAGE_BYTES: 5 * 1024 * 1024, // 5MB
  CLEANUP_THRESHOLD: 0.8, // 80% usage
} as const;

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKENS: 'sphyr_auth_tokens',
  USER_PREFERENCES: 'sphyr_user_preferences',
  SEARCH_HISTORY: 'sphyr_search_history',
  SEARCH_RANKINGS: 'sphyr_search_rankings',
  QUERY_PROCESSING: 'sphyr_query_processing',
  DOCUMENT_SUMMARIES: 'sphyr_document_summaries',
  CONTENT_TAGGING: 'sphyr_content_tagging',
  CONTENT_SUGGESTIONS: 'sphyr_content_suggestions',
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  TTFB: 600, // Time to First Byte (ms)
  PAGE_LOAD_TIME: 3000, // Page load time (ms)
  COMPONENT_RENDER_TIME: 100, // Component render time (ms)
  API_RESPONSE_TIME: 500, // API response time (ms)
  SEARCH_RESPONSE_TIME: 1000, // Search response time (ms)
  CLICK_RESPONSE_TIME: 100, // Click response time (ms)
} as const;

// UI dimensions
export const UI_DIMENSIONS = {
  ICON_SIZE_SMALL: 8, // h-8 w-8
  ICON_SIZE_MEDIUM: 12, // h-12 w-12
  ICON_SIZE_LARGE: 16, // h-16 w-16
  BORDER_WIDTH: 2, // border-2
  BORDER_RADIUS: 8, // rounded-lg
} as const;

// Color values (for reference, actual colors should use CSS classes)
export const COLOR_VALUES = {
  RED_500: 500,
  BLUE_500: 500,
  GREEN_500: 500,
  PURPLE_500: 500,
  ORANGE_500: 500,
  YELLOW_500: 500,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  SEARCH: '/api/search',
  USER_PROFILE: '/api/user/profile',
  DELETE_ACCOUNT: '/api/user/delete-account',
} as const;

// Integration providers
export const INTEGRATION_PROVIDERS = {
  GOOGLE: 'google',
  SLACK: 'slack',
  ASANA: 'asana',
  QUICKBOOKS: 'quickbooks',
  MICROSOFT: 'microsoft',
  PROCORE: 'procore',
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Invalid input provided',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  RATE_LIMITED: 'Too many requests',
  NETWORK_ERROR: 'Network request failed',
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Search configuration
export const SEARCH_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_SORT_ORDER: 'relevance',
  MAX_SUGGESTIONS: 10,
  minQueryLength: 2,
  maxResults: 100,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
} as const;

// Accessibility
export const ACCESSIBILITY = {
  SKIP_LINK_TEXT: 'Skip to main content',
  ARIA_LABEL_SEARCH: 'Search',
  ARIA_LABEL_CLOSE: 'Close',
  ARIA_LABEL_LOADING: 'Loading',
} as const;