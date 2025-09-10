/**
 * Health Check API Endpoint
 * Provides comprehensive application health status and dependency checks
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { reportError } from '@/lib/monitoring';
import { searchOrchestrator } from '@/lib/search/search-orchestrator';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    integrations: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
  metrics: {
    responseTime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  responseTime?: number;
  details?: Record<string, unknown>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResult | { error: string }>
) {
  const startTime = Date.now();
  const requestId = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.setRequestId(requestId);
  logger.info('Health check initiated', { requestId });

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const healthChecks = await performHealthChecks();
    const responseTime = Date.now() - startTime;
    
    // Determine overall status
    const overallStatus = determineOverallStatus(healthChecks);
    
    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: healthChecks,
      metrics: {
        responseTime,
        memoryUsage: process.memoryUsage(),
      },
    };

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    logger.info('Health check completed', { 
      status: overallStatus, 
      responseTime,
      requestId 
    });

    res.status(httpStatus).json(result);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Health check failed', error as Error, { 
      responseTime,
      requestId 
    });

    await reportError(error as Error, {
      endpoint: '/api/health',
      operation: 'healthCheck',
      responseTime,
      requestId,
    });

    res.status(503).json({
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Perform all health checks
 */
async function performHealthChecks(): Promise<HealthCheckResult['checks']> {
  const [databaseCheck, integrationsCheck, memoryCheck, diskCheck] = await Promise.allSettled([
    checkDatabase(),
    checkIntegrations(),
    checkMemory(),
    checkDisk(),
  ]);

  return {
    database: databaseCheck.status === 'fulfilled' ? databaseCheck.value : {
      status: 'fail',
      message: 'Database check failed',
      details: { error: databaseCheck.reason?.message },
    },
    integrations: integrationsCheck.status === 'fulfilled' ? integrationsCheck.value : {
      status: 'fail',
      message: 'Integrations check failed',
      details: { error: integrationsCheck.reason?.message },
    },
    memory: memoryCheck.status === 'fulfilled' ? memoryCheck.value : {
      status: 'fail',
      message: 'Memory check failed',
      details: { error: memoryCheck.reason?.message },
    },
    disk: diskCheck.status === 'fulfilled' ? diskCheck.value : {
      status: 'fail',
      message: 'Disk check failed',
      details: { error: diskCheck.reason?.message },
    },
  };
}

/**
 * Check database connectivity and performance
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = createServiceClient();
    
    // Test basic connectivity with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        status: 'fail',
        message: `Database connection failed: ${error.message}`,
        responseTime,
        details: { error: error.message, code: error.code },
      };
    }
    
    // Check response time thresholds
    if (responseTime > 5000) {
      return {
        status: 'warn',
        message: `Database response time is slow: ${responseTime}ms`,
        responseTime,
        details: { threshold: 5000 },
      };
    }
    
    return {
      status: 'pass',
      message: 'Database connection healthy',
      responseTime,
      details: { recordCount: data?.length || 0 },
    };
    
  } catch (error) {
    return {
      status: 'fail',
      message: `Database check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
      details: { error: (error as Error).message },
    };
  }
}

/**
 * Check integration service availability
 */
async function checkIntegrations(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Check if required environment variables are present
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return {
        status: 'warn',
        message: `Missing environment variables: ${missingVars.join(', ')}`,
        responseTime: Date.now() - startTime,
        details: { missingVariables: missingVars },
      };
    }
    
    // Test external service connectivity (non-blocking)
    const externalChecks = await Promise.allSettled([
      testGoogleAPIConnectivity(),
      testSupabaseConnectivity(),
    ]);
    
    const failedChecks = externalChecks.filter(check => check.status === 'rejected');
    
    if (failedChecks.length > 0) {
      return {
        status: 'warn',
        message: `${failedChecks.length} external service(s) unreachable`,
        responseTime: Date.now() - startTime,
        details: { 
          failedServices: failedChecks.map((_, index) => 
            index === 0 ? 'google' : 'supabase'
          ),
        },
      };
    }
    
    // Get SearchOrchestrator health status
    const orchestratorHealth = searchOrchestrator.getHealthSummary();
    const integrationHealth = searchOrchestrator.getIntegrationHealth();
    
    // Determine overall integration health status
    let overallStatus: 'pass' | 'warn' | 'fail' = 'pass';
    let message = 'All integrations healthy';
    
    if (orchestratorHealth.overallHealth === 'unhealthy') {
      overallStatus = 'fail';
      message = `${orchestratorHealth.unhealthyIntegrations} integration(s) unhealthy`;
    } else if (orchestratorHealth.overallHealth === 'degraded') {
      overallStatus = 'warn';
      message = 'Some integrations degraded';
    }
    
    return {
      status: overallStatus,
      message,
      responseTime: Date.now() - startTime,
      details: { 
        checkedServices: ['google', 'supabase'],
        orchestratorHealth,
        integrationHealth,
      },
    };
    
  } catch (error) {
    return {
      status: 'fail',
      message: `Integrations check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
      details: { error: (error as Error).message },
    };
  }
}

/**
 * Check memory usage
 */
async function checkMemory(): Promise<HealthCheck> {
  const startTime = Date.now();
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  const memUsagePercent = (usedMem / totalMem) * 100;
  
  // Memory thresholds
  const warningThreshold = 80; // 80% memory usage
  const criticalThreshold = 95; // 95% memory usage
  
  if (memUsagePercent >= criticalThreshold) {
    return {
      status: 'fail',
      message: `Critical memory usage: ${memUsagePercent.toFixed(1)}%`,
      responseTime: Date.now() - startTime,
      details: {
        usagePercent: memUsagePercent,
        heapUsed: usedMem,
        heapTotal: totalMem,
        threshold: criticalThreshold,
      },
    };
  }
  
  if (memUsagePercent >= warningThreshold) {
    return {
      status: 'warn',
      message: `High memory usage: ${memUsagePercent.toFixed(1)}%`,
      responseTime: Date.now() - startTime,
      details: {
        usagePercent: memUsagePercent,
        heapUsed: usedMem,
        heapTotal: totalMem,
        threshold: warningThreshold,
      },
    };
  }
  
  return {
    status: 'pass',
    message: `Memory usage healthy: ${memUsagePercent.toFixed(1)}%`,
    responseTime: Date.now() - startTime,
    details: {
      usagePercent: memUsagePercent,
      heapUsed: usedMem,
      heapTotal: totalMem,
    },
  };
}

/**
 * Check disk space (simplified check)
 */
async function checkDisk(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // In a serverless environment, we can't easily check disk space
    // This is a placeholder for future implementation
    // For now, we'll just check if we can write to temp directory
    
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    
    const tempDir = os.tmpdir();
    const testFile = path.join(tempDir, `health_check_${Date.now()}.tmp`);
    
    try {
      fs.writeFileSync(testFile, 'health check');
      fs.unlinkSync(testFile);
      
      return {
        status: 'pass',
        message: 'Disk write access healthy',
        responseTime: Date.now() - startTime,
        details: { tempDir },
      };
    } catch (writeError) {
      return {
        status: 'warn',
        message: 'Disk write access limited',
        responseTime: Date.now() - startTime,
        details: { 
          error: (writeError as Error).message,
          tempDir,
        },
      };
    }
    
  } catch (error) {
    return {
      status: 'warn',
      message: 'Disk check not available',
      responseTime: Date.now() - startTime,
      details: { error: (error as Error).message },
    };
  }
}

/**
 * Test Google API connectivity
 */
async function testGoogleAPIConnectivity(): Promise<void> {
  // Simple connectivity test - just check if we can reach Google's servers
  const response = await fetch('https://www.googleapis.com', {
    method: 'HEAD',
    signal: AbortSignal.timeout(5000), // 5 second timeout
  });
  
  if (!response.ok) {
    throw new Error(`Google API unreachable: ${response.status}`);
  }
}

/**
 * Test Supabase connectivity
 */
async function testSupabaseConnectivity(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured');
  }
  
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'HEAD',
    signal: AbortSignal.timeout(5000), // 5 second timeout
  });
  
  if (!response.ok) {
    throw new Error(`Supabase unreachable: ${response.status}`);
  }
}

/**
 * Determine overall health status based on individual checks
 */
function determineOverallStatus(checks: HealthCheckResult['checks']): 'healthy' | 'degraded' | 'unhealthy' {
  const checkResults = Object.values(checks);
  
  // If any check fails, overall status is unhealthy
  if (checkResults.some(check => check.status === 'fail')) {
    return 'unhealthy';
  }
  
  // If any check warns, overall status is degraded
  if (checkResults.some(check => check.status === 'warn')) {
    return 'degraded';
  }
  
  // All checks pass
  return 'healthy';
}
