import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/search';
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock all external dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}));

vi.mock('@/lib/search/token-fetcher', () => ({
  TokenFetcher: vi.fn().mockImplementation(() => ({
    fetchAllTokens: vi.fn(),
  })),
}));

vi.mock('@/lib/integrations/adapter-factory', () => ({
  AdapterFactory: {
    createAdaptersFromEnv: vi.fn(),
  },
}));

vi.mock('@/lib/search/query-processor', () => ({
  QueryProcessor: vi.fn().mockImplementation(() => ({
    processQuery: vi.fn(),
  })),
}));

vi.mock('@/lib/search/search-orchestrator', () => ({
  searchOrchestrator: {
    executeAllSearches: vi.fn(),
  },
}));

vi.mock('@/lib/search/result-transformer', () => ({
  ResultTransformer: vi.fn().mockImplementation(() => ({
    transformResults: vi.fn(),
  })),
}));

vi.mock('@/lib/search/response-builder', () => ({
  ResponseBuilder: vi.fn().mockImplementation(() => ({
    buildResponse: vi.fn(),
  })),
}));

vi.mock('@/lib/monitoring', () => ({
  reportError: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    setRequestId: vi.fn(),
    logRequestStart: vi.fn(),
    logRequestEnd: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  generateRequestId: vi.fn(() => 'test-request-id'),
}));

describe('/api/search Integration Tests', () => {
  let mockReq: NextApiRequest;
  let mockRes: NextApiResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        query: 'test search query',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        organizationId: '650e8400-e29b-41d4-a716-446655440000',
      },
    });
    mockReq = req;
    mockRes = res;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('HTTP Method Validation', () => {
    it('should reject non-POST requests', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method GET Not Allowed',
      });
    });

    it('should reject PUT requests', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PUT',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method PUT Not Allowed',
      });
    });
  });

  describe('Input Validation', () => {
    it('should reject empty query', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          query: '',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          organizationId: '650e8400-e29b-41d4-a716-446655440000',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('Invalid request data');
      expect(response.code).toBe('VALIDATION_ERROR');
    });

    it('should reject query that is too long', async () => {
      const longQuery = 'a'.repeat(501);
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          query: longQuery,
          userId: '550e8400-e29b-41d4-a716-446655440000',
          organizationId: '650e8400-e29b-41d4-a716-446655440000',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('Invalid request data');
      expect(response.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid UUID format for userId', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          query: 'test query',
          userId: 'invalid-uuid',
          organizationId: '650e8400-e29b-41d4-a716-446655440000',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('Invalid request data');
      expect(response.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid UUID format for organizationId', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          query: 'test query',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          organizationId: 'invalid-uuid',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('Invalid request data');
      expect(response.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing userId and organizationId', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          query: 'test query',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('User ID and Organization ID are required');
      expect(response.code).toBe('MISSING_CREDENTIALS');
    });
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      await handler(mockReq, mockRes);

      expect(mockRes._getStatusCode()).toBe(401);
      expect(JSON.parse(mockRes._getData())).toEqual({
        error: 'Authentication required',
      });
    });

    it('should proceed with authenticated user', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { TokenFetcher } = await import('@/lib/search/token-fetcher');
      const { AdapterFactory } = await import('@/lib/integrations/adapter-factory');
      const { QueryProcessor } = await import('@/lib/search/query-processor');
      const { searchOrchestrator } = await import('@/lib/search/search-orchestrator');
      const { ResultTransformer } = await import('@/lib/search/result-transformer');
      const { ResponseBuilder } = await import('@/lib/search/response-builder');

      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      const mockTokenFetcher = vi.mocked(TokenFetcher);
      const mockTokenFetcherInstance = {
        fetchAllTokens: vi.fn().mockResolvedValue({
          tokens: {
            google: { accessToken: 'google-token', refreshToken: 'google-refresh' },
            slack: null,
            asana: null,
            quickbooks: null,
            microsoft: null,
            procore: null,
          },
        }),
      };
      mockTokenFetcher.mockImplementation(() => mockTokenFetcherInstance as any);

      const mockAdapterFactory = vi.mocked(AdapterFactory);
      mockAdapterFactory.createAdaptersFromEnv.mockReturnValue({} as any);

      const mockQueryProcessor = vi.mocked(QueryProcessor);
      const mockQueryProcessorInstance = {
        processQuery: vi.fn().mockResolvedValue({
          processedQuery: 'processed test query',
          intent: 'search',
        }),
      };
      mockQueryProcessor.mockImplementation(() => mockQueryProcessorInstance as any);

      const mockSearchOrchestrator = vi.mocked(searchOrchestrator);
      mockSearchOrchestrator.executeAllSearches.mockResolvedValue([]);

      const mockResultTransformer = vi.mocked(ResultTransformer);
      const mockResultTransformerInstance = {
        transformResults: vi.fn().mockReturnValue([]),
      };
      mockResultTransformer.mockImplementation(() => mockResultTransformerInstance as any);

      const mockResponseBuilder = vi.mocked(ResponseBuilder);
      const mockResponseBuilderInstance = {
        buildResponse: vi.fn().mockResolvedValue({
          success: true,
          data: [],
          metadata: {
            totalResults: 0,
            executionTime: 100,
            requestId: 'test-request-id',
          },
        }),
      };
      mockResponseBuilder.mockImplementation(() => mockResponseBuilderInstance as any);

      await handler(mockReq, mockRes);

      expect(mockRes._getStatusCode()).toBe(200);
      const response = JSON.parse(mockRes._getData());
      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
    });
  });

  describe('Integration Requirements', () => {
    it('should require Google integration', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { TokenFetcher } = await import('@/lib/search/token-fetcher');

      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      const mockTokenFetcher = vi.mocked(TokenFetcher);
      const mockTokenFetcherInstance = {
        fetchAllTokens: vi.fn().mockResolvedValue({
          tokens: {
            google: null, // No Google tokens
            slack: null,
            asana: null,
            quickbooks: null,
            microsoft: null,
            procore: null,
          },
        }),
      };
      mockTokenFetcher.mockImplementation(() => mockTokenFetcherInstance as any);

      await handler(mockReq, mockRes);

      expect(mockRes._getStatusCode()).toBe(400);
      expect(JSON.parse(mockRes._getData())).toEqual({
        error: 'Google account connection required',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle integration errors gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { TokenFetcher } = await import('@/lib/search/token-fetcher');
      const { AdapterFactory } = await import('@/lib/integrations/adapter-factory');
      const { QueryProcessor } = await import('@/lib/search/query-processor');
      const { searchOrchestrator } = await import('@/lib/search/search-orchestrator');

      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      const mockTokenFetcher = vi.mocked(TokenFetcher);
      const mockTokenFetcherInstance = {
        fetchAllTokens: vi.fn().mockResolvedValue({
          tokens: {
            google: { accessToken: 'google-token', refreshToken: 'google-refresh' },
            slack: null,
            asana: null,
            quickbooks: null,
            microsoft: null,
            procore: null,
          },
        }),
      };
      mockTokenFetcher.mockImplementation(() => mockTokenFetcherInstance as any);

      const mockAdapterFactory = vi.mocked(AdapterFactory);
      mockAdapterFactory.createAdaptersFromEnv.mockReturnValue({} as any);

      const mockQueryProcessor = vi.mocked(QueryProcessor);
      const mockQueryProcessorInstance = {
        processQuery: vi.fn().mockResolvedValue({
          processedQuery: 'processed test query',
          intent: 'search',
        }),
      };
      mockQueryProcessor.mockImplementation(() => mockQueryProcessorInstance as any);

      const mockSearchOrchestrator = vi.mocked(searchOrchestrator);
      mockSearchOrchestrator.executeAllSearches.mockRejectedValue(
        new Error('Integration service unavailable')
      );

      await handler(mockReq, mockRes);

      expect(mockRes._getStatusCode()).toBe(500);
      const response = JSON.parse(mockRes._getData());
      expect(response.error).toBe('An unexpected error occurred during smart search. Please try again.');
      expect(response.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle validation errors with proper status code', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          query: 'a'.repeat(501), // Invalid query length
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('Invalid request data');
      expect(response.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Successful Search Flow', () => {
    it('should complete full search flow successfully', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { TokenFetcher } = await import('@/lib/search/token-fetcher');
      const { AdapterFactory } = await import('@/lib/integrations/adapter-factory');
      const { QueryProcessor } = await import('@/lib/search/query-processor');
      const { searchOrchestrator } = await import('@/lib/search/search-orchestrator');
      const { ResultTransformer } = await import('@/lib/search/result-transformer');
      const { ResponseBuilder } = await import('@/lib/search/response-builder');

      // Setup mocks
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      const mockTokenFetcher = vi.mocked(TokenFetcher);
      const mockTokenFetcherInstance = {
        fetchAllTokens: vi.fn().mockResolvedValue({
          tokens: {
            google: { accessToken: 'google-token', refreshToken: 'google-refresh' },
            slack: null,
            asana: null,
            quickbooks: null,
            microsoft: null,
            procore: null,
          },
        }),
      };
      mockTokenFetcher.mockImplementation(() => mockTokenFetcherInstance as any);

      const mockAdapterFactory = vi.mocked(AdapterFactory);
      mockAdapterFactory.createAdaptersFromEnv.mockReturnValue({} as any);

      const mockQueryProcessor = vi.mocked(QueryProcessor);
      const mockQueryProcessorInstance = {
        processQuery: vi.fn().mockResolvedValue({
          processedQuery: 'processed test query',
          intent: 'search',
        }),
      };
      mockQueryProcessor.mockImplementation(() => mockQueryProcessorInstance as any);

      const mockSearchOrchestrator = vi.mocked(searchOrchestrator);
      mockSearchOrchestrator.executeAllSearches.mockResolvedValue([
        {
          success: true,
          integration: 'google',
          service: 'gmail',
          data: { messages: [] },
        },
      ]);

      const mockResultTransformer = vi.mocked(ResultTransformer);
      const mockResultTransformerInstance = {
        transformResults: vi.fn().mockReturnValue([
          {
            id: 'result-1',
            title: 'Test Result',
            content: 'Test content',
            source: 'Gmail',
            integrationType: 'google_gmail',
            metadata: {},
            url: 'https://example.com',
            createdAt: '2024-01-01T10:00:00Z',
          },
        ]),
      };
      mockResultTransformer.mockImplementation(() => mockResultTransformerInstance as any);

      const mockResponseBuilder = vi.mocked(ResponseBuilder);
      const mockResponseBuilderInstance = {
        buildResponse: vi.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: 'result-1',
              title: 'Test Result',
              content: 'Test content',
              source: 'Gmail',
              integrationType: 'google_gmail',
              metadata: {},
              url: 'https://example.com',
              createdAt: '2024-01-01T10:00:00Z',
            },
          ],
          metadata: {
            totalResults: 1,
            executionTime: 150,
            requestId: 'test-request-id',
          },
        }),
      };
      mockResponseBuilder.mockImplementation(() => mockResponseBuilderInstance as any);

      await handler(mockReq, mockRes);

      expect(mockRes._getStatusCode()).toBe(200);
      const response = JSON.parse(mockRes._getData());
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].title).toBe('Test Result');
      expect(response.metadata.totalResults).toBe(1);
      expect(response.metadata.executionTime).toBe(150);
    });
  });

  describe('Performance and Logging', () => {
    it('should log request start and end', async () => {
      const { logger } = await import('@/lib/logger');
      const mockLogger = vi.mocked(logger);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          query: 'test query',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          organizationId: '650e8400-e29b-41d4-a716-446655440000',
        },
      });

      await handler(req, res);

      expect(mockLogger.setRequestId).toHaveBeenCalledWith('test-request-id');
      expect(mockLogger.logRequestStart).toHaveBeenCalledWith('POST', '/api/search');
    });

    it('should measure execution time', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { TokenFetcher } = await import('@/lib/search/token-fetcher');
      const { AdapterFactory } = await import('@/lib/integrations/adapter-factory');
      const { QueryProcessor } = await import('@/lib/search/query-processor');
      const { searchOrchestrator } = await import('@/lib/search/search-orchestrator');
      const { ResultTransformer } = await import('@/lib/search/result-transformer');
      const { ResponseBuilder } = await import('@/lib/search/response-builder');

      // Setup mocks for successful flow
      const mockCreateClient = vi.mocked(createClient);
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockReturnValue(mockSupabase as any);

      const mockTokenFetcher = vi.mocked(TokenFetcher);
      const mockTokenFetcherInstance = {
        fetchAllTokens: vi.fn().mockResolvedValue({
          tokens: {
            google: { accessToken: 'google-token', refreshToken: 'google-refresh' },
            slack: null,
            asana: null,
            quickbooks: null,
            microsoft: null,
            procore: null,
          },
        }),
      };
      mockTokenFetcher.mockImplementation(() => mockTokenFetcherInstance as any);

      const mockAdapterFactory = vi.mocked(AdapterFactory);
      mockAdapterFactory.createAdaptersFromEnv.mockReturnValue({} as any);

      const mockQueryProcessor = vi.mocked(QueryProcessor);
      const mockQueryProcessorInstance = {
        processQuery: vi.fn().mockResolvedValue({
          processedQuery: 'processed test query',
          intent: 'search',
        }),
      };
      mockQueryProcessor.mockImplementation(() => mockQueryProcessorInstance as any);

      const mockSearchOrchestrator = vi.mocked(searchOrchestrator);
      mockSearchOrchestrator.executeAllSearches.mockResolvedValue([]);

      const mockResultTransformer = vi.mocked(ResultTransformer);
      const mockResultTransformerInstance = {
        transformResults: vi.fn().mockReturnValue([]),
      };
      mockResultTransformer.mockImplementation(() => mockResultTransformerInstance as any);

      const mockResponseBuilder = vi.mocked(ResponseBuilder);
      const mockResponseBuilderInstance = {
        buildResponse: vi.fn().mockResolvedValue({
          success: true,
          data: [],
          metadata: {
            totalResults: 0,
            executionTime: 100,
            requestId: 'test-request-id',
          },
        }),
      };
      mockResponseBuilder.mockImplementation(() => mockResponseBuilderInstance as any);

      await handler(mockReq, mockRes);

      expect(mockRes._getStatusCode()).toBe(200);
      const response = JSON.parse(mockRes._getData());
      expect(response.metadata.executionTime).toBeGreaterThan(0);
    });
  });
});
