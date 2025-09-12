import { logger } from '@/lib/logger';
import { SphyrError, APIError, IntegrationError, ValidationError } from '@/lib/errors';
import { ERROR_MESSAGES } from '@/lib/constants';
import { ErrorContextEnhancer, type EnhancedErrorContext } from './enhanced-error-context';

export interface ErrorHandlerOptions {
  component?: string;
  operation?: string;
  context?: Record<string, unknown>;
  showUserMessage?: boolean;
  fallbackMessage?: string;
  enhancedContext?: EnhancedErrorContext;
}

export interface ErrorHandlerResult {
  userMessage: string;
  shouldRetry: boolean;
  errorId: string;
}

/**
 * Standardized error handler for consistent error processing across the application
 */
export class ErrorHandler {
  /**
   * Handle errors with consistent logging, user messaging, and error reporting
   */
  static handle(
    error: unknown,
    options: ErrorHandlerOptions = {}
  ): ErrorHandlerResult {
    const {
      component = 'Unknown',
      operation = 'unknown',
      context = {},
      showUserMessage: _showUserMessage = true,
      fallbackMessage = ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      enhancedContext = {}
    } = options;

    // Convert unknown error to Error instance
    const errorInstance = this.normalizeError(error) as Error & { id?: string };
    
    // Create enhanced error context
    const baseEnhancedContext: EnhancedErrorContext = {
      component,
      operation,
      ...enhancedContext,
      customContext: {
        ...enhancedContext.customContext,
        ...context,
      },
    };

    const fullEnhancedContext = ErrorContextEnhancer.enhanceError(
      errorInstance,
      baseEnhancedContext
    );
    
    // Log the error with enhanced context
    logger.error(`Error in ${component} during ${operation}`, errorInstance, {
      ...fullEnhancedContext,
      errorId: errorInstance.id || 'unknown'
    });

    // Get user-friendly message
    const userMessage = this.getUserMessage(errorInstance, fallbackMessage);
    
    // Determine if error is retryable
    const shouldRetry = this.isRetryable(errorInstance);

    return {
      userMessage,
      shouldRetry,
      errorId: errorInstance.id || 'unknown'
    };
  }

  /**
   * Handle API errors specifically
   */
  static handleAPIError(
    error: unknown,
    endpoint: string,
    options: Omit<ErrorHandlerOptions, 'operation'> = {}
  ): ErrorHandlerResult {
    return this.handle(error, {
      ...options,
      operation: `api_${endpoint}`,
      context: {
        ...options.context,
        endpoint
      }
    });
  }

  /**
   * Handle integration errors specifically
   */
  static handleIntegrationError(
    error: unknown,
    provider: string,
    options: Omit<ErrorHandlerOptions, 'operation'> = {}
  ): ErrorHandlerResult {
    return this.handle(error, {
      ...options,
      operation: `integration_${provider}`,
      context: {
        ...options.context,
        provider
      }
    });
  }

  /**
   * Handle validation errors specifically
   */
  static handleValidationError(
    error: unknown,
    field?: string,
    options: Omit<ErrorHandlerOptions, 'operation'> = {}
  ): ErrorHandlerResult {
    return this.handle(error, {
      ...options,
      operation: field ? `validation_${field}` : 'validation',
      context: {
        ...options.context,
        field
      }
    });
  }

  /**
   * Convert unknown error to Error instance
   */
  private static normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return new Error(String((error as { message: unknown }).message));
    }
    
    return new Error('An unknown error occurred');
  }

  /**
   * Get user-friendly error message
   */
  private static getUserMessage(error: Error, fallback: string): string {
    if (error instanceof SphyrError) {
      return error.getUserMessage();
    }
    
    if (error instanceof APIError) {
      return error.getUserMessage();
    }
    
    if (error instanceof IntegrationError) {
      return error.getUserMessage();
    }
    
    if (error instanceof ValidationError) {
      return error.getUserMessage();
    }
    
    // For generic errors, return a safe user message
    return fallback;
  }

  /**
   * Check if error is retryable
   */
  private static isRetryable(error: Error): boolean {
    if (error instanceof SphyrError) {
      return error.isRetryable();
    }
    
    if (error instanceof APIError) {
      return error.isRetryable();
    }
    
    if (error instanceof IntegrationError) {
      return error.isRetryable();
    }
    
    // Network errors are generally retryable
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return true;
    }
    
    return false;
  }

  /**
   * Create a standardized error response for API endpoints
   */
  static createErrorResponse(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500
  ) {
    return {
      error: {
        message,
        code,
        timestamp: new Date().toISOString(),
        statusCode
      }
    };
  }

  /**
   * Create a standardized success response for API endpoints
   */
  static createSuccessResponse<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Hook for handling errors in React components
 */
export function useErrorHandler() {
  const handleError = (
    error: unknown,
    options: ErrorHandlerOptions = {}
  ): ErrorHandlerResult => {
    return ErrorHandler.handle(error, options);
  };

  const handleAPIError = (
    error: unknown,
    endpoint: string,
    options: Omit<ErrorHandlerOptions, 'operation'> = {}
  ): ErrorHandlerResult => {
    return ErrorHandler.handleAPIError(error, endpoint, options);
  };

  const handleIntegrationError = (
    error: unknown,
    provider: string,
    options: Omit<ErrorHandlerOptions, 'operation'> = {}
  ): ErrorHandlerResult => {
    return ErrorHandler.handleIntegrationError(error, provider, options);
  };

  const handleValidationError = (
    error: unknown,
    field?: string,
    options: Omit<ErrorHandlerOptions, 'operation'> = {}
  ): ErrorHandlerResult => {
    return ErrorHandler.handleValidationError(error, field, options);
  };

  return {
    handleError,
    handleAPIError,
    handleIntegrationError,
    handleValidationError
  };
}

/**
 * Utility function for wrapping async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const result = ErrorHandler.handle(error, options);
    
    // If we should retry and it's a network error, we could implement retry logic here
    if (result.shouldRetry && options.operation?.includes('api')) {
      // For now, just log that we could retry
      logger.warn('Operation failed but is retryable', {
        operation: options.operation,
        errorId: result.errorId,
        userMessage: result.userMessage
      });
    }
    
    return null;
  }
}
