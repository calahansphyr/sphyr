import { createServiceClient } from '../../lib/supabase/server';
import { logger, generateRequestId } from '../../lib/logger';
import { createErrorResponse } from '../../lib/schemas';
import type { NextApiRequest, NextApiResponse } from 'next';

interface TestResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse | { error: string; code?: string; details?: unknown; timestamp: string; requestId?: string }>
): Promise<void> {
  const requestId = generateRequestId();
  logger.setRequestId(requestId);
  
  logger.info('Database connection test initiated', {
    endpoint: '/api/test-db',
    method: req.method,
    requestId
  });

  if (req.method !== 'GET') {
    logger.warn('Invalid method for database test endpoint', {
      method: req.method,
      endpoint: '/api/test-db'
    });
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const supabase = createServiceClient();
    
    // Test database connection by querying organizations table
    const { error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (error) {
      logger.error('Database connection test failed', error, {
        operation: 'database_test',
        endpoint: '/api/test-db',
        errorCode: error.code,
        errorMessage: error.message
      });
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection failed',
        error: error.message 
      });
    }
    
    // Test auth connection
    const { error: authError } = await supabase.auth.getSession();
    
    logger.info('Database connection test completed successfully', {
      operation: 'database_test',
      endpoint: '/api/test-db',
      databaseStatus: 'Connected',
      authStatus: authError ? 'Error' : 'Available',
      authError: authError?.message
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Supabase connection successful',
      data: {
        database: 'Connected',
        auth: authError ? 'Auth error: ' + authError.message : 'Auth service available',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Database connection test failed with exception', error instanceof Error ? error : new Error(String(error)), {
      operation: 'database_test',
      endpoint: '/api/test-db'
    });
    res.status(500).json(createErrorResponse(
      'Database connection test failed',
      'DATABASE_CONNECTION_ERROR',
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'database_test'
      }
    ));
  }
}
