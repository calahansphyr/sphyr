/**
 * Enhanced Error Context Utilities
 * Provides comprehensive debugging information and context for error handling
 */

import { logger } from '../logger';
import { SphyrError } from '../errors';

export interface EnhancedErrorContext {
  // Request/Operation Context
  requestId?: string;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  
  // Technical Context
  userAgent?: string;
  url?: string;
  method?: string;
  endpoint?: string;
  operation?: string;
  component?: string;
  
  // Performance Context
  startTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  
  // Environment Context
  environment?: string;
  version?: string;
  buildId?: string;
  
  // Integration Context
  provider?: string;
  service?: string;
  integrationId?: string;
  
  // Data Context
  query?: string;
  dataSize?: number;
  recordCount?: number;
  
  // Error Chain Context
  originalError?: Error;
  errorChain?: string[];
  retryCount?: number;
  lastRetryTime?: number;
  
  // Custom Context
  customContext?: Record<string, unknown>;
}

export interface ErrorContextEnhancerOptions {
  includeStackTrace?: boolean;
  includeMemoryUsage?: boolean;
  includePerformanceMetrics?: boolean;
  includeUserContext?: boolean;
  includeTechnicalContext?: boolean;
  maxContextDepth?: number;
}

/**
 * Enhanced Error Context Enhancer
 * Provides comprehensive error context and debugging information
 */
export class ErrorContextEnhancer {
  private static readonly DEFAULT_OPTIONS: ErrorContextEnhancerOptions = {
    includeStackTrace: true,
    includeMemoryUsage: true,
    includePerformanceMetrics: true,
    includeUserContext: true,
    includeTechnicalContext: true,
    maxContextDepth: 5,
  };

  /**
   * Enhance error with comprehensive context
   */
  static enhanceError(
    error: unknown,
    baseContext: EnhancedErrorContext = {},
    options: ErrorContextEnhancerOptions = {}
  ): EnhancedErrorContext {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const enhancedContext: EnhancedErrorContext = { ...baseContext };

    try {
      // Add technical context
      if (opts.includeTechnicalContext) {
        this.addTechnicalContext(enhancedContext);
      }

      // Add performance context
      if (opts.includePerformanceMetrics) {
        this.addPerformanceContext(enhancedContext);
      }

      // Add memory usage context
      if (opts.includeMemoryUsage) {
        this.addMemoryContext(enhancedContext);
      }

      // Add user context
      if (opts.includeUserContext) {
        this.addUserContext(enhancedContext);
      }

      // Add error chain context
      this.addErrorChainContext(error, enhancedContext, opts);

      // Add stack trace context
      if (opts.includeStackTrace) {
        this.addStackTraceContext(error, enhancedContext);
      }

      // Add environment context
      this.addEnvironmentContext(enhancedContext);

      // Calculate duration if start time is provided
      if (enhancedContext.startTime) {
        enhancedContext.duration = Date.now() - enhancedContext.startTime;
      }

    } catch (contextError) {
      // If context enhancement fails, log it but don't throw
      logger.warn('Failed to enhance error context', {
        operation: 'enhanceError',
        originalError: error instanceof Error ? error.message : String(error),
        contextError: contextError instanceof Error ? contextError.message : String(contextError),
      });
    }

    return enhancedContext;
  }

  /**
   * Add technical context information
   */
  private static addTechnicalContext(context: EnhancedErrorContext): void {
    if (typeof window !== 'undefined') {
      // Browser context
      context.userAgent = window.navigator.userAgent;
      context.url = window.location.href;
      
      // Add browser performance context
      if (window.performance && (window.performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory) {
        const memory = (window.performance as Performance & { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        context.memoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }
    } else {
      // Server context
      context.userAgent = 'server';
      context.url = 'server';
    }
  }

  /**
   * Add performance context information
   */
  private static addPerformanceContext(context: EnhancedErrorContext): void {
    if (typeof window !== 'undefined' && window.performance) {
      const perf = window.performance;
      
      // Add navigation timing if available
      if (perf.timing) {
        context.customContext = {
          ...context.customContext,
          navigationTiming: {
            domContentLoaded: perf.timing.domContentLoadedEventEnd - perf.timing.navigationStart,
            loadComplete: perf.timing.loadEventEnd - perf.timing.navigationStart,
            firstPaint: perf.getEntriesByType('paint')[0]?.startTime,
          },
        };
      }

      // Add resource timing
      const resources = perf.getEntriesByType('resource');
      if (resources.length > 0) {
        context.customContext = {
          ...context.customContext,
          resourceCount: resources.length,
          slowestResource: Math.max(...resources.map(r => r.duration)),
        };
      }
    }
  }

  /**
   * Add memory usage context
   */
  private static addMemoryContext(context: EnhancedErrorContext): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      context.memoryUsage = process.memoryUsage();
    }
  }

  /**
   * Add user context information
   */
  private static addUserContext(context: EnhancedErrorContext): void {
    // Try to get user context from various sources
    if (typeof window !== 'undefined') {
      // Check for user context in localStorage or sessionStorage
      try {
        const userContext = localStorage.getItem('sphyr_user_context');
        if (userContext) {
          const parsed = JSON.parse(userContext);
          context.userId = parsed.userId || context.userId;
          context.organizationId = parsed.organizationId || context.organizationId;
          context.sessionId = parsed.sessionId || context.sessionId;
        }
      } catch (_e) {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Add error chain context
   */
  private static addErrorChainContext(
    error: unknown,
    context: EnhancedErrorContext,
    options: ErrorContextEnhancerOptions
  ): void {
    if (error instanceof Error) {
      context.originalError = error;
      
      // Build error chain
      const errorChain: string[] = [];
      let currentError: Error | null = error;
      let depth = 0;

      while (currentError && depth < (options.maxContextDepth || 5)) {
        errorChain.push(`${currentError.constructor.name}: ${currentError.message}`);
        
        // Check if it's a SphyrError with originalError
        if (currentError instanceof SphyrError && currentError.context.originalError) {
          currentError = currentError.context.originalError as Error;
        } else {
          currentError = null;
        }
        depth++;
      }

      context.errorChain = errorChain;
    }
  }

  /**
   * Add stack trace context
   */
  private static addStackTraceContext(
    error: unknown,
    context: EnhancedErrorContext
  ): void {
    if (error instanceof Error && error.stack) {
      // Parse stack trace for useful information
      const stackLines = error.stack.split('\n');
      const relevantFrames = stackLines
        .filter(line => 
          line.includes('src/') && 
          !line.includes('node_modules') &&
          !line.includes('ErrorContextEnhancer')
        )
        .slice(0, 5); // Limit to 5 most relevant frames

      context.customContext = {
        ...context.customContext,
        stackTrace: {
          full: error.stack,
          relevantFrames,
          frameCount: stackLines.length,
        },
      };
    }
  }

  /**
   * Add environment context
   */
  private static addEnvironmentContext(context: EnhancedErrorContext): void {
    context.environment = process.env.NODE_ENV || 'unknown';
    context.version = process.env.npm_package_version || 'unknown';
    context.buildId = process.env.BUILD_ID || 'unknown';
  }

  /**
   * Create a comprehensive error report
   */
  static createErrorReport(
    error: unknown,
    baseContext: EnhancedErrorContext = {},
    options: ErrorContextEnhancerOptions = {}
  ): {
    error: {
      message: string;
      name: string;
      stack?: string;
    };
    context: EnhancedErrorContext;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    const enhancedContext = this.enhanceError(error, baseContext, options);
    
    const errorInfo = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack,
    } : {
      message: String(error),
      name: 'UnknownError',
    };

    // Determine severity based on error type and context
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (error instanceof SphyrError) {
      severity = error.metadata.severity as 'low' | 'medium' | 'high' | 'critical';
    } else if (error instanceof Error) {
      if (error.name.includes('Network') || error.name.includes('Timeout')) {
        severity = 'high';
      } else if (error.name.includes('Validation') || error.name.includes('Auth')) {
        severity = 'medium';
      }
    }

    // Upgrade severity based on context
    if (enhancedContext.retryCount && enhancedContext.retryCount > 3) {
      severity = 'critical';
    }
    if (enhancedContext.duration && enhancedContext.duration > 30000) {
      severity = 'high';
    }

    return {
      error: errorInfo,
      context: enhancedContext,
      timestamp: new Date().toISOString(),
      severity,
    };
  }

  /**
   * Log enhanced error with comprehensive context
   */
  static logEnhancedError(
    error: unknown,
    baseContext: EnhancedErrorContext = {},
    options: ErrorContextEnhancerOptions = {}
  ): void {
    const report = this.createErrorReport(error, baseContext, options);
    
    logger.error('Enhanced error report', error instanceof Error ? error : new Error(String(error)), {
      ...report.context,
      errorReport: report,
    });
  }
}

/**
 * Utility function to create enhanced error context
 */
export function createEnhancedErrorContext(
  baseContext: EnhancedErrorContext = {}
): EnhancedErrorContext {
  return ErrorContextEnhancer.enhanceError(new Error('Context creation'), baseContext);
}

/**
 * Utility function to wrap operations with enhanced error context
 */
export async function withEnhancedErrorContext<T>(
  operation: () => Promise<T>,
  baseContext: EnhancedErrorContext = {},
  options: ErrorContextEnhancerOptions = {}
): Promise<T> {
  const startTime = Date.now();
  const contextWithTiming = { ...baseContext, startTime };

  try {
    return await operation();
  } catch (error) {
    ErrorContextEnhancer.logEnhancedError(error, contextWithTiming, options);
    throw error;
  }
}

/**
 * Utility function to enhance existing SphyrError with additional context
 */
export function enhanceSphyrError(
  error: SphyrError,
  additionalContext: EnhancedErrorContext = {}
): SphyrError {
  const enhancedContext = ErrorContextEnhancer.enhanceError(error, additionalContext);
  
  // Create new SphyrError with enhanced context
  return new SphyrError(
    error.message,
    error.metadata,
    {
      ...error.context,
      ...enhancedContext,
      enhancedAt: new Date().toISOString(),
    }
  );
}
