import { describe, it, expect } from 'vitest';
import {
  SearchRequestSchema,
  OAuthCallbackSchema,
  UserProfileUpdateSchema,
  IntegrationConnectionSchema,
  OAuthTokenRefreshSchema,
  ErrorResponseSchema,
  SuccessResponseSchema,
  PaginationSchema,
  SearchFiltersSchema,
  ExtendedSearchRequestSchema,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/schemas';

describe('Schema Validation Tests', () => {
  describe('SearchRequestSchema', () => {
    it('should validate a valid search request', () => {
      const validRequest = {
        query: 'test search query',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        organizationId: '650e8400-e29b-41d4-a716-446655440000',
      };

      const result = SearchRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('test search query');
        expect(result.data.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(result.data.organizationId).toBe('650e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('should reject empty query', () => {
      const invalidRequest = {
        query: '',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        organizationId: '650e8400-e29b-41d4-a716-446655440000',
      };

      const result = SearchRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Query cannot be empty');
      }
    });

    it('should reject query that is too long', () => {
      const longQuery = 'a'.repeat(501);
      const invalidRequest = {
        query: longQuery,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        organizationId: '650e8400-e29b-41d4-a716-446655440000',
      };

      const result = SearchRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Query must be less than 500 characters');
      }
    });

    it('should reject invalid UUID format for userId', () => {
      const invalidRequest = {
        query: 'test query',
        userId: 'invalid-uuid',
        organizationId: '650e8400-e29b-41d4-a716-446655440000',
      };

      const result = SearchRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid user ID format');
      }
    });

    it('should reject invalid UUID format for organizationId', () => {
      const invalidRequest = {
        query: 'test query',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        organizationId: 'invalid-uuid',
      };

      const result = SearchRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid organization ID format');
      }
    });

    it('should trim whitespace from query', () => {
      const requestWithWhitespace = {
        query: '  test query  ',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        organizationId: '650e8400-e29b-41d4-a716-446655440000',
      };

      const result = SearchRequestSchema.safeParse(requestWithWhitespace);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('test query');
      }
    });

    it('should allow optional userId and organizationId', () => {
      const minimalRequest = {
        query: 'test query',
      };

      const result = SearchRequestSchema.safeParse(minimalRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('test query');
        expect(result.data.userId).toBeUndefined();
        expect(result.data.organizationId).toBeUndefined();
      }
    });
  });

  describe('OAuthCallbackSchema', () => {
    it('should validate a valid OAuth callback', () => {
      const validCallback = {
        code: 'valid-auth-code',
        state: 'csrf-state-token',
      };

      const result = OAuthCallbackSchema.safeParse(validCallback);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('valid-auth-code');
        expect(result.data.state).toBe('csrf-state-token');
      }
    });

    it('should reject empty authorization code', () => {
      const invalidCallback = {
        code: '',
        state: 'csrf-state-token',
      };

      const result = OAuthCallbackSchema.safeParse(invalidCallback);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Authorization code is required');
      }
    });

    it('should handle OAuth error responses', () => {
      const errorCallback = {
        code: 'dummy-code', // Required field
        error: 'access_denied',
        error_description: 'User denied access',
      };

      const result = OAuthCallbackSchema.safeParse(errorCallback);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.error).toBe('access_denied');
        expect(result.data.error_description).toBe('User denied access');
      }
    });
  });

  describe('UserProfileUpdateSchema', () => {
    it('should validate a valid profile update', () => {
      const validUpdate = {
        name: 'John Doe',
        email: 'john@example.com',
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'en',
        },
      };

      const result = UserProfileUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.email).toBe('john@example.com');
        expect(result.data.preferences?.theme).toBe('dark');
      }
    });

    it('should reject invalid email format', () => {
      const invalidUpdate = {
        email: 'invalid-email',
      };

      const result = UserProfileUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format');
      }
    });

    it('should reject invalid theme value', () => {
      const invalidUpdate = {
        preferences: {
          theme: 'invalid-theme',
        },
      };

      const result = UserProfileUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid option');
      }
    });

    it('should reject invalid language code', () => {
      const invalidUpdate = {
        preferences: {
          language: 'invalid',
        },
      };

      const result = UserProfileUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Language must be a 2-character code');
      }
    });

    it('should allow partial updates', () => {
      const partialUpdate = {
        name: 'Jane Doe',
      };

      const result = UserProfileUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Jane Doe');
        expect(result.data.email).toBeUndefined();
        expect(result.data.preferences).toBeUndefined();
      }
    });
  });

  describe('IntegrationConnectionSchema', () => {
    it('should validate a valid integration connection', () => {
      const validConnection = {
        provider: 'google',
        scopes: ['gmail.readonly', 'drive.readonly'],
        redirectUri: 'https://app.sphyr.com/auth/google/callback',
      };

      const result = IntegrationConnectionSchema.safeParse(validConnection);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provider).toBe('google');
        expect(result.data.scopes).toEqual(['gmail.readonly', 'drive.readonly']);
        expect(result.data.redirectUri).toBe('https://app.sphyr.com/auth/google/callback');
      }
    });

    it('should reject invalid provider', () => {
      const invalidConnection = {
        provider: 'invalid-provider',
      };

      const result = IntegrationConnectionSchema.safeParse(invalidConnection);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid option');
      }
    });

    it('should reject invalid redirect URI', () => {
      const invalidConnection = {
        provider: 'google',
        redirectUri: 'not-a-url',
      };

      const result = IntegrationConnectionSchema.safeParse(invalidConnection);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid redirect URI');
      }
    });

    it('should allow minimal connection request', () => {
      const minimalConnection = {
        provider: 'slack',
      };

      const result = IntegrationConnectionSchema.safeParse(minimalConnection);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provider).toBe('slack');
        expect(result.data.scopes).toBeUndefined();
        expect(result.data.redirectUri).toBeUndefined();
      }
    });
  });

  describe('OAuthTokenRefreshSchema', () => {
    it('should validate a valid token refresh request', () => {
      const validRefresh = {
        provider: 'google',
        refreshToken: 'valid-refresh-token',
      };

      const result = OAuthTokenRefreshSchema.safeParse(validRefresh);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provider).toBe('google');
        expect(result.data.refreshToken).toBe('valid-refresh-token');
      }
    });

    it('should reject empty refresh token', () => {
      const invalidRefresh = {
        provider: 'google',
        refreshToken: '',
      };

      const result = OAuthTokenRefreshSchema.safeParse(invalidRefresh);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Refresh token is required');
      }
    });
  });

  describe('PaginationSchema', () => {
    it('should validate valid pagination parameters', () => {
      const validPagination = {
        page: 2,
        limit: 25,
        sortBy: 'created_at',
        sortOrder: 'asc',
      };

      const result = PaginationSchema.safeParse(validPagination);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(25);
        expect(result.data.sortBy).toBe('created_at');
        expect(result.data.sortOrder).toBe('asc');
      }
    });

    it('should apply default values', () => {
      const minimalPagination = {};

      const result = PaginationSchema.safeParse(minimalPagination);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should reject invalid page number', () => {
      const invalidPagination = {
        page: 0,
      };

      const result = PaginationSchema.safeParse(invalidPagination);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Page must be at least 1');
      }
    });

    it('should reject limit that is too high', () => {
      const invalidPagination = {
        limit: 101,
      };

      const result = PaginationSchema.safeParse(invalidPagination);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Limit cannot exceed 100');
      }
    });
  });

  describe('SearchFiltersSchema', () => {
    it('should validate valid search filters', () => {
      const validFilters = {
        sources: ['gmail', 'slack'],
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z',
        },
        fileTypes: ['pdf', 'docx'],
        integrationTypes: ['google', 'microsoft'],
      };

      const result = SearchFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sources).toEqual(['gmail', 'slack']);
        expect(result.data.dateRange?.start).toBe('2024-01-01T00:00:00Z');
        expect(result.data.fileTypes).toEqual(['pdf', 'docx']);
      }
    });

    it('should reject invalid date format', () => {
      const invalidFilters = {
        dateRange: {
          start: 'invalid-date',
        },
      };

      const result = SearchFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid ISO datetime');
      }
    });
  });

  describe('ExtendedSearchRequestSchema', () => {
    it('should validate a complete search request with filters and pagination', () => {
      const completeRequest = {
        query: 'test query',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        organizationId: '650e8400-e29b-41d4-a716-446655440000',
        page: 1,
        limit: 20,
        sortBy: 'relevance',
        sortOrder: 'desc',
        sources: ['gmail', 'slack'],
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z',
        },
      };

      const result = ExtendedSearchRequestSchema.safeParse(completeRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('test query');
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sources).toEqual(['gmail', 'slack']);
      }
    });
  });

  describe('Response Schema Utilities', () => {
    describe('createErrorResponse', () => {
      it('should create a valid error response', () => {
        const errorResponse = createErrorResponse(
          'Something went wrong',
          'VALIDATION_ERROR',
          { field: 'email' },
          'req-123'
        );

        expect(errorResponse.error).toBe('Something went wrong');
        expect(errorResponse.code).toBe('VALIDATION_ERROR');
        expect(errorResponse.details).toEqual({ field: 'email' });
        expect(errorResponse.requestId).toBe('req-123');
        expect(errorResponse.timestamp).toBeDefined();
        expect(new Date(errorResponse.timestamp)).toBeInstanceOf(Date);
      });

      it('should create error response with minimal parameters', () => {
        const errorResponse = createErrorResponse('Generic error');

        expect(errorResponse.error).toBe('Generic error');
        expect(errorResponse.code).toBeUndefined();
        expect(errorResponse.details).toBeUndefined();
        expect(errorResponse.requestId).toBeUndefined();
        expect(errorResponse.timestamp).toBeDefined();
      });
    });

    describe('createSuccessResponse', () => {
      it('should create a valid success response', () => {
        const successResponse = createSuccessResponse(
          'Operation completed',
          { id: '123', name: 'Test' },
          'req-456'
        );

        expect(successResponse.message).toBe('Operation completed');
        expect(successResponse.data).toEqual({ id: '123', name: 'Test' });
        expect(successResponse.requestId).toBe('req-456');
        expect(successResponse.timestamp).toBeDefined();
        expect(new Date(successResponse.timestamp)).toBeInstanceOf(Date);
      });

      it('should create success response with minimal parameters', () => {
        const successResponse = createSuccessResponse('Success');

        expect(successResponse.message).toBe('Success');
        expect(successResponse.data).toBeUndefined();
        expect(successResponse.requestId).toBeUndefined();
        expect(successResponse.timestamp).toBeDefined();
      });
    });
  });
});
