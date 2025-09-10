import { createServiceClient } from '../../lib/supabase/server';
import type { NextApiRequest, NextApiResponse } from 'next';

interface TestResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse>
): Promise<void> {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const supabase = createServiceClient();
    
    // Test database connection by querying organizations table
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection failed',
        error: error.message 
      });
    }
    
    // Test auth connection
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
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
    console.error('Connection test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
