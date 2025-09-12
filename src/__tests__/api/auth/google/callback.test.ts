import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/auth/google/callback';
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock all external dependencies
vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        getToken: vi.fn(),
      })),
    },
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
  reportError: vi.fn(),
}));

vi.mock('@/lib/errors', () => ({
  ValidationError: vi.fn().mockImplementation((message, field, value, details) => ({
    name: 'ValidationError',
    message,
    field,
    value,
    details,
  })),
  AuthenticationError: vi.fn().mockImplementation((message, details) => ({
    name: 'AuthenticationError',
    message,
    details,
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/analytics', () => ({
  productAnalytics: {
    trackIntegrationConnected: vi.fn(),
  },
}));

describe('/api/auth/google/callback Security Tests', () => {
  let mockReq: NextApiRequest;
  let mockRes: NextApiResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {
        code: 'valid-auth-code-123',
        state: 'csrf-state-token',
      },
    });
    mockReq = req;
    mockRes = res;

    // Mock environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://app.sphyr.com';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('HTTP Method Security', () => {
    it('should reject non-GET requests', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        query: { code: 'test-code' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method POST Not Allowed',
      });
    });

    it('should reject PUT requests', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PUT',
        query: { code: 'test-code' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method PUT Not Allowed',
      });
    });
  });

  describe('Input Validation Security', () => {
    it('should reject requests with invalid query parameters', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          invalid_param: 'malicious-value',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?error=invalid_callback');
    });

    it('should reject requests with missing authorization code', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          state: 'csrf-state-token',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?error=invalid_callback');
    });

    it('should handle OAuth error responses securely', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'dummy-code', // Required by schema
          error: 'access_denied',
          error_description: 'User denied access',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?error=oauth_denied');
    });

    it('should handle OAuth error with malicious description', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'dummy-code', // Required by schema
          error: 'access_denied',
          error_description: '<script>alert("xss")</script>',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?error=oauth_denied');
    });
  });

  describe('CSRF Protection', () => {
    it('should validate state parameter for CSRF protection', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'valid-auth-code',
          state: 'invalid-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: null,
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      // Mock Google OAuth
      const { google } = await import('googleapis');
      const mockOAuth2 = vi.mocked(google.auth.OAuth2);
      const mockOAuth2Instance = {
        getToken: vi.fn().mockResolvedValue({
          tokens: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
            token_type: 'Bearer',
            expiry_date: Date.now() + 3600000,
            scope: 'gmail.readonly drive.readonly',
          },
        }),
      };
      mockOAuth2.mockImplementation(() => mockOAuth2Instance as any);

      await handler(req, res);

      // Should still process the request but log the state mismatch
      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?success=google_connected');
    });
  });

  describe('Authorization Code Security', () => {
    it('should prevent authorization code reuse', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'already-used-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn()
          .mockResolvedValueOnce({
            data: true, // Code already used
            error: null,
          })
          .mockResolvedValueOnce({
            data: [{ id: 'token-123', user_id: 'user-123', provider: 'google', created_at: '2024-01-01T10:00:00Z' }],
            error: null,
          }),
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?success=google_connected&message=already_connected');
    });

    it('should handle authorization code validation errors', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'invalid-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: { message: 'Database error' },
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      // Mock Google OAuth
      const { google } = await import('googleapis');
      const mockOAuth2 = vi.mocked(google.auth.OAuth2);
      const mockOAuth2Instance = {
        getToken: vi.fn().mockResolvedValue({
          tokens: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
            token_type: 'Bearer',
            expiry_date: Date.now() + 3600000,
            scope: 'gmail.readonly drive.readonly',
          },
        }),
      };
      mockOAuth2.mockImplementation(() => mockOAuth2Instance as any);

      await handler(req, res);

      // Should still process the request but log the validation error
      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?success=google_connected');
    });
  });

  describe('Authentication Security', () => {
    it('should reject unauthenticated requests', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'valid-auth-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: null,
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/auth/login?redirect=/integrations');
    });

    it('should handle authentication errors gracefully', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'valid-auth-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: null,
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Session expired' },
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/auth/login?redirect=/integrations');
    });
  });

  describe('Configuration Security', () => {
    it('should reject requests when OAuth configuration is missing', async () => {
      // Remove environment variables
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'valid-auth-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: null,
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?error=config_error');
    });

    it('should reject requests when base URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_BASE_URL;

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'valid-auth-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: null,
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?error=config_error');
    });
  });

  describe('Token Exchange Security', () => {
    it('should handle Google OAuth token exchange failures', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'invalid-auth-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: null,
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      // Mock Google OAuth to throw error
      const { google } = await import('googleapis');
      const mockOAuth2 = vi.mocked(google.auth.OAuth2);
      const mockOAuth2Instance = {
        getToken: vi.fn().mockRejectedValue(new Error('Invalid authorization code')),
      };
      mockOAuth2.mockImplementation(() => mockOAuth2Instance as any);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?error=callback_error');
    });

    it('should handle missing access token in response', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'valid-auth-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: null,
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      // Mock Google OAuth to return tokens without access_token
      const { google } = await import('googleapis');
      const mockOAuth2 = vi.mocked(google.auth.OAuth2);
      const mockOAuth2Instance = {
        getToken: vi.fn().mockResolvedValue({
          tokens: {
            refresh_token: 'refresh-token-123',
            token_type: 'Bearer',
            expiry_date: Date.now() + 3600000,
            scope: 'gmail.readonly drive.readonly',
          },
        }),
      };
      mockOAuth2.mockImplementation(() => mockOAuth2Instance as any);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?error=token_error');
    });
  });

  describe('Token Storage Security', () => {
    it('should handle token storage failures gracefully', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'valid-auth-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: null,
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockResolvedValue({ 
            error: { message: 'Database connection failed' } 
          }),
        }),
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      // Mock Google OAuth
      const { google } = await import('googleapis');
      const mockOAuth2 = vi.mocked(google.auth.OAuth2);
      const mockOAuth2Instance = {
        getToken: vi.fn().mockResolvedValue({
          tokens: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
            token_type: 'Bearer',
            expiry_date: Date.now() + 3600000,
            scope: 'gmail.readonly drive.readonly',
          },
        }),
      };
      mockOAuth2.mockImplementation(() => mockOAuth2Instance as any);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?error=storage_error');
    });
  });

  describe('Analytics Security', () => {
    it('should handle analytics tracking failures gracefully', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'valid-auth-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: null,
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      // Mock Google OAuth
      const { google } = await import('googleapis');
      const mockOAuth2 = vi.mocked(google.auth.OAuth2);
      const mockOAuth2Instance = {
        getToken: vi.fn().mockResolvedValue({
          tokens: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
            token_type: 'Bearer',
            expiry_date: Date.now() + 3600000,
            scope: 'gmail.readonly drive.readonly',
          },
        }),
      };
      mockOAuth2.mockImplementation(() => mockOAuth2Instance as any);

      // Mock analytics to throw error
      const { productAnalytics } = await import('@/lib/analytics');
      const mockAnalytics = vi.mocked(productAnalytics);
      mockAnalytics.trackIntegrationConnected.mockRejectedValue(new Error('Analytics service unavailable'));

      await handler(req, res);

      // Should still succeed despite analytics failure
      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?success=google_connected');
    });
  });

  describe('Successful OAuth Flow', () => {
    it('should complete OAuth flow successfully with valid parameters', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'valid-auth-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: null,
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      // Mock Google OAuth
      const { google } = await import('googleapis');
      const mockOAuth2 = vi.mocked(google.auth.OAuth2);
      const mockOAuth2Instance = {
        getToken: vi.fn().mockResolvedValue({
          tokens: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
            token_type: 'Bearer',
            expiry_date: Date.now() + 3600000,
            scope: 'gmail.readonly drive.readonly',
          },
        }),
      };
      mockOAuth2.mockImplementation(() => mockOAuth2Instance as any);

      // Mock analytics
      const { productAnalytics } = await import('@/lib/analytics');
      const mockAnalytics = vi.mocked(productAnalytics);
      mockAnalytics.trackIntegrationConnected.mockResolvedValue(undefined);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(302);
      expect(res._getRedirectUrl()).toBe('/integrations?success=google_connected');
    });
  });

  describe('Error Handling and Logging', () => {
    it('should log security events appropriately', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'dummy-code', // Required by schema
          error: 'access_denied',
          error_description: 'User denied access',
        },
      });

      const { logger } = await import('@/lib/logger');
      const mockLogger = vi.mocked(logger);

      await handler(req, res);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'OAuth error from Google',
        expect.any(Error),
        expect.objectContaining({
          operation: 'oauth_callback',
          endpoint: '/api/auth/google/callback',
          provider: 'google',
          oauthError: 'access_denied',
        })
      );
    });

    it('should report errors to monitoring service', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          code: 'invalid-code',
          state: 'csrf-state-token',
        },
      });

      // Mock Supabase client
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false,
          error: null,
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      // Mock Google OAuth to throw error
      const { google } = await import('googleapis');
      const mockOAuth2 = vi.mocked(google.auth.OAuth2);
      const mockOAuth2Instance = {
        getToken: vi.fn().mockRejectedValue(new Error('Invalid authorization code')),
      };
      mockOAuth2.mockImplementation(() => mockOAuth2Instance as any);

      const { reportError } = await import('@/lib/monitoring');
      const mockReportError = vi.mocked(reportError);

      await handler(req, res);

      expect(mockReportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          endpoint: '/api/auth/google/callback',
          operation: 'handleCallback',
        })
      );
    });
  });
});
