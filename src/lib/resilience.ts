/**
 * API Resilience Utilities for Sphyr
 * Provides timeout, retry, and error handling patterns for robust API calls
 */

import { logger } from './logger';
import { IntegrationError } from './errors';

export interface TimeoutConfig {
  timeoutMs: number;
  errorMessage?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

/**
 * Wrap a promise with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  const { timeoutMs, errorMessage = `Operation timed out after ${timeoutMs}ms` } = config;
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
    
    promise
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Retry a promise with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<RetryResult<T>> {
  const {
    maxAttempts,
    baseDelayMs,
    maxDelayMs,
    backoffMultiplier,
    retryCondition = (error: Error) => isRetryableError(error),
  } = config;
  
  let lastError: Error;
  let attempt = 0;
  const startTime = Date.now();
  
  while (attempt < maxAttempts) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts: attempt + 1,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error as Error;
      attempt++;
      
      // Check if we should retry
      if (!retryCondition(lastError) || attempt >= maxAttempts) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );
      
      logger.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: lastError.message,
        attempt,
        maxAttempts,
        delay,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    error: lastError!,
    attempts: attempt,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Network errors
  if (error.message.includes('ECONNRESET') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ECONNREFUSED')) {
    return true;
  }
  
  // HTTP status codes that are retryable
  if (error instanceof IntegrationError) {
    const statusCode = (error as IntegrationError & { statusCode?: number }).statusCode;
    if (statusCode === 429 || // Rate limited
        statusCode === 502 || // Bad Gateway
        statusCode === 503 || // Service Unavailable
        statusCode === 504) { // Gateway Timeout
      return true;
    }
  }
  
  // Timeout errors
  if (error.message.includes('timed out') ||
      error.message.includes('timeout')) {
    return true;
  }
  
  return false;
}

/**
 * Default retry configuration for integration calls
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  baseDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryCondition: isRetryableError,
};

/**
 * Default timeout configuration for integration calls
 */
export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  timeoutMs: 8000, // 8 seconds
  errorMessage: 'Integration call timed out after 8 seconds',
};

/**
 * Execute an integration call with resilience patterns
 */
export async function executeWithResilience<T>(
  operation: () => Promise<T>,
  integrationName: string,
  operationName: string,
  timeoutConfig: TimeoutConfig = DEFAULT_TIMEOUT_CONFIG,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  const startTime = Date.now();
  
  logger.logIntegrationStart(integrationName, operationName);
  
  try {
    // Wrap with timeout and retry
    const retryResult = await withRetry(
      () => withTimeout(operation(), timeoutConfig),
      retryConfig
    );
    
    const duration = Date.now() - startTime;
    
    if (retryResult.success) {
      logger.logIntegrationEnd(integrationName, operationName, true, duration, {
        attempts: retryResult.attempts,
        totalTime: retryResult.totalTime,
      });
      return retryResult.data!;
    } else {
      logger.logIntegrationEnd(integrationName, operationName, false, duration, {
        attempts: retryResult.attempts,
        totalTime: retryResult.totalTime,
        error: retryResult.error?.message,
      });
      throw retryResult.error;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logIntegrationEnd(integrationName, operationName, false, duration, {
      error: (error as Error).message,
    });
    throw error;
  }
}
