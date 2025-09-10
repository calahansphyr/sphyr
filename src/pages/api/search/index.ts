/**
 * Smart Search API Endpoint - Refactored
 * Thin controller that orchestrates search modules
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { reportError } from '@/lib/monitoring';
import { IntegrationError, ValidationError, AuthenticationError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { SearchRequestSchema, createErrorResponse } from '@/lib/schemas';
import { logger, generateRequestId } from '@/lib/logger';
import { AdapterFactory } from '@/lib/integrations/adapter-factory';
import { searchOrchestrator } from '@/lib/search/search-orchestrator';
import { QueryProcessor } from '@/lib/search/query-processor';
import { TokenFetcher } from '@/lib/search/token-fetcher';
import { ResultTransformer } from '@/lib/search/result-transformer';
import { ResponseBuilder, type SmartSearchResponse } from '@/lib/search/response-builder';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SmartSearchResponse | { error: string }>
) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  // Set up structured logging context
  logger.setRequestId(requestId);
  logger.logRequestStart(req.method || 'UNKNOWN', req.url || '/api/search');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    logger.warn('Invalid HTTP method', { method: req.method, allowedMethods: ['POST'] });
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Validate input using Zod schema
    const validationResult = SearchRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const validationError = new ValidationError(
        'Invalid request data',
        'requestBody',
        req.body,
        { validationErrors: validationResult.error.issues }
      );
      await reportError(validationError, { endpoint: '/api/search', operation: 'validateInput' });
      return res.status(400).json(createErrorResponse(
        'Invalid request data',
        'VALIDATION_ERROR',
        validationResult.error.issues
      ));
    }

    const { query, userId = 'default-user', organizationId = 'default-org' } = validationResult.data;

    logger.info('Smart search query received', { 
      query, 
      userId, 
      organizationId,
      requestId 
    });

    // Step 1: Authenticate user
    const supabase = createClient(req, res);
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !authUser) {
      const authError = new AuthenticationError(
        'User must be authenticated to perform search',
        { userError: userError?.message }
      );
      await reportError(authError, { endpoint: '/api/search', operation: 'getUser' });
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Step 2: Fetch OAuth tokens in parallel
    const tokenFetcher = new TokenFetcher(req, res);
    const { tokens } = await tokenFetcher.fetchAllTokens(authUser.id);

    // Step 3: Create adapters using the factory
    if (!tokens.google) {
      const integrationError = new IntegrationError(
        'Google',
        'No Google account connected. Please connect your Google account in Settings.',
        { error: 'Missing Google tokens' }
      );
      await reportError(integrationError, { endpoint: '/api/search', operation: 'createAdapters' });
      return res.status(400).json({ error: 'Google account connection required' });
    }

    const adapters = AdapterFactory.createAdaptersFromEnv(
      tokens.google,
      tokens.slack,
      tokens.asana,
      tokens.quickbooks,
      tokens.microsoft,
      tokens.procore
    );

    // Step 4: Process query with AI
    const queryProcessor = new QueryProcessor();
    const queryResult = await queryProcessor.processQuery({
      originalQuery: query,
      userId,
      organizationId,
      adapters,
    });

    // Step 5: Execute searches using SearchOrchestrator
    const searchResults = await searchOrchestrator.executeAllSearches(
      adapters,
      queryResult.processedQuery,
      requestId
    );

    // Step 6: Transform results to AI format
    const resultTransformer = new ResultTransformer();
    const aiSearchResults = resultTransformer.transformResults(searchResults);

    // Step 7: Build final response with ranking
    const responseBuilder = new ResponseBuilder();
    const response = await responseBuilder.buildResponse({
      originalQuery: query,
      processedQuery: queryResult.processedQuery,
      intent: queryResult.intent,
      aiSearchResults,
      executionTime: Date.now() - startTime,
      userId,
      organizationId,
      requestId,
    });

    logger.logRequestEnd(req.method || 'POST', req.url || '/api/search', 200, Date.now() - startTime, {
      totalResults: aiSearchResults.length,
      rankedResults: response.data.length,
      requestId
    });

    res.status(200).json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Smart search API error', error as Error, {
      endpoint: '/api/search',
      operation: 'smartSearch',
      executionTime,
      requestId
    });

    // Report error to monitoring service
    await reportError(error as Error, {
      endpoint: '/api/search',
      operation: 'smartSearch',
      executionTime,
      requestId,
    });

    // Return appropriate error response
    if (error instanceof IntegrationError) {
      logger.logRequestEnd(req.method || 'POST', req.url || '/api/search', 502, executionTime, {
        errorType: 'INTEGRATION_ERROR',
        requestId
      });
      return res.status(502).json(createErrorResponse(
        `Integration error: ${error.getUserMessage()}`,
        'INTEGRATION_ERROR'
      ));
    }

    if (error instanceof ValidationError) {
      logger.logRequestEnd(req.method || 'POST', req.url || '/api/search', 400, executionTime, {
        errorType: 'VALIDATION_ERROR',
        requestId
      });
      return res.status(400).json(createErrorResponse(
        error.getUserMessage(),
        'VALIDATION_ERROR'
      ));
    }

    logger.logRequestEnd(req.method || 'POST', req.url || '/api/search', 500, executionTime, {
      errorType: 'INTERNAL_SERVER_ERROR',
      requestId
    });
    res.status(500).json(createErrorResponse(
      'An unexpected error occurred during smart search. Please try again.',
      'INTERNAL_SERVER_ERROR'
    ));
  }
}
