/**
 * Zod Validation Schemas for Sphyr API
 * Provides type-safe input validation for all API endpoints
 */

import { z } from 'zod';

/**
 * Search API Request Schema
 * Validates search query requests with optional user context
 */
export const SearchRequestSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(500, 'Query must be less than 500 characters')
    .trim(),
  userId: z.string()
    .uuid('Invalid user ID format')
    .optional(),
  organizationId: z.string()
    .uuid('Invalid organization ID format')
    .optional(),
});

/**
 * OAuth Callback Schema
 * Validates OAuth callback requests from third-party providers
 */
export const OAuthCallbackSchema = z.object({
  code: z.string()
    .min(1, 'Authorization code is required'),
  state: z.string()
    .optional(),
  error: z.string()
    .optional(),
  error_description: z.string()
    .optional(),
});

/**
 * User Profile Update Schema
 * Validates user profile update requests
 */
export const UserProfileUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system'])
      .optional(),
    notifications: z.boolean()
      .optional(),
    language: z.string()
      .length(2, 'Language must be a 2-character code')
      .optional(),
  })
    .optional(),
});

/**
 * Integration Connection Schema
 * Validates integration connection requests
 */
export const IntegrationConnectionSchema = z.object({
  provider: z.enum([
    'google',
    'slack',
    'asana',
    'hubspot',
    'quickbooks',
    'procore',
    'buildertrend'
  ]),
  scopes: z.array(z.string())
    .optional(),
  redirectUri: z.string()
    .url('Invalid redirect URI')
    .optional(),
});

/**
 * OAuth Token Refresh Schema
 * Validates OAuth token refresh requests
 */
export const OAuthTokenRefreshSchema = z.object({
  provider: z.enum([
    'google',
    'slack',
    'asana',
    'hubspot',
    'quickbooks',
    'procore',
    'buildertrend'
  ]),
  refreshToken: z.string()
    .min(1, 'Refresh token is required'),
});

/**
 * Error Response Schema
 * Standardized error response format
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string()
    .optional(),
  details: z.unknown()
    .optional(),
  timestamp: z.string()
    .datetime(),
  requestId: z.string()
    .optional(),
});

/**
 * Success Response Schema
 * Standardized success response format
 */
export const SuccessResponseSchema = z.object({
  message: z.string(),
  data: z.unknown()
    .optional(),
  timestamp: z.string()
    .datetime(),
  requestId: z.string()
    .optional(),
});

/**
 * Pagination Schema
 * Common pagination parameters
 */
export const PaginationSchema = z.object({
  page: z.number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  sortBy: z.string()
    .optional(),
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
});

/**
 * Search Filters Schema
 * Additional search filtering options
 */
export const SearchFiltersSchema = z.object({
  sources: z.array(z.string())
    .optional(),
  dateRange: z.object({
    start: z.string()
      .datetime()
      .optional(),
    end: z.string()
      .datetime()
      .optional(),
  })
    .optional(),
  fileTypes: z.array(z.string())
    .optional(),
  integrationTypes: z.array(z.string())
    .optional(),
});

/**
 * Extended Search Request Schema
 * Combines search request with filters and pagination
 */
export const ExtendedSearchRequestSchema = SearchRequestSchema
  .merge(PaginationSchema)
  .merge(SearchFiltersSchema);

/**
 * Type exports for use in API routes
 */
export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type OAuthCallback = z.infer<typeof OAuthCallbackSchema>;
export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;
export type IntegrationConnection = z.infer<typeof IntegrationConnectionSchema>;
export type OAuthTokenRefresh = z.infer<typeof OAuthTokenRefreshSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
export type ExtendedSearchRequest = z.infer<typeof ExtendedSearchRequestSchema>;

/**
 * Utility function to create standardized error responses
 */
export function createErrorResponse(
  error: string,
  code?: string,
  details?: unknown,
  requestId?: string
): ErrorResponse {
  return {
    error,
    code,
    details,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * Utility function to create standardized success responses
 */
export function createSuccessResponse(
  message: string,
  data?: unknown,
  requestId?: string
): SuccessResponse {
  return {
    message,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };
}
