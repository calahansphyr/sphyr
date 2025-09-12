/**
 * Standardized error handling utilities for integration adapters
 * Provides consistent error processing across all integration adapters
 */

import { IntegrationError, toSphyrError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { ErrorContextEnhancer, type EnhancedErrorContext } from '@/lib/utils/enhanced-error-context';

export interface IntegrationErrorContext {
  provider: string;
  operation: string;
  context?: Record<string, unknown>;
  userMessage?: string;
  enhancedContext?: EnhancedErrorContext;
}

/**
 * Standardized error handler for integration adapters
 * Converts any error to a proper IntegrationError with consistent handling
 */
export class IntegrationErrorHandler {
  /**
   * Handle integration errors with consistent patterns
   */
  static handle(
    error: unknown,
    options: IntegrationErrorContext
  ): IntegrationError {
    const { provider, operation, context = {}, userMessage, enhancedContext = {} } = options;

    // Create enhanced error context
    const baseEnhancedContext: EnhancedErrorContext = {
      component: `${provider} Adapter`,
      operation,
      ...enhancedContext,
      customContext: {
        ...enhancedContext.customContext,
        ...context,
      },
    };

    const fullEnhancedContext = ErrorContextEnhancer.enhanceError(
      error as Error,
      baseEnhancedContext
    );

    // Log the error for debugging
    logger.error(`Integration error in ${provider} during ${operation}`, error as Error, {
      ...fullEnhancedContext
    });

    // Convert to SphyrError first to get consistent base handling
    const sphyrError = toSphyrError(error, {
      provider,
      operation,
      ...context
    });

    // Handle specific error types based on provider
    const integrationError = this.createIntegrationError(
      error,
      provider,
      operation,
      context,
      userMessage || sphyrError.message
    );

    return integrationError;
  }

  /**
   * Create IntegrationError with provider-specific error handling
   */
  private static createIntegrationError(
    error: unknown,
    provider: string,
    operation: string,
    context: Record<string, unknown>,
    fallbackMessage: string
  ): IntegrationError {
    // Handle HTTP status codes
    const statusCode = this.extractStatusCode(error);
    if (statusCode) {
      return this.handleHttpError(error, provider, operation, context, statusCode);
    }

    // Handle provider-specific error codes
    const errorCode = this.extractErrorCode(error);
    if (errorCode) {
      return this.handleProviderError(error, provider, operation, context, errorCode);
    }

    // Default error handling
    return new IntegrationError(
      provider,
      fallbackMessage,
      {
        originalError: error as Error,
        operation,
        context,
        userMessage: this.getUserFriendlyMessage(provider, operation, fallbackMessage)
      }
    );
  }

  /**
   * Extract HTTP status code from error
   */
  private static extractStatusCode(error: unknown): number | null {
    if (error && typeof error === 'object') {
      // Check for status property
      if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
        return (error as { status: number }).status;
      }
      
      // Check for statusCode property
      if ('statusCode' in error && typeof (error as { statusCode: unknown }).statusCode === 'number') {
        return (error as { statusCode: number }).statusCode;
      }

      // Check for code property (some APIs use this)
      if ('code' in error && typeof (error as { code: unknown }).code === 'number') {
        return (error as { code: number }).code;
      }
    }
    return null;
  }

  /**
   * Extract provider-specific error code
   */
  private static extractErrorCode(error: unknown): string | null {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: unknown }).code;
      if (typeof code === 'string') {
        return code;
      }
    }
    return null;
  }

  /**
   * Handle HTTP status code errors
   */
  private static handleHttpError(
    error: unknown,
    provider: string,
    operation: string,
    context: Record<string, unknown>,
    statusCode: number
  ): IntegrationError {
    switch (statusCode) {
      case 401:
        return new IntegrationError(
          provider,
          'Authentication failed. Please reconnect your account.',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: `Your ${provider} session has expired. Please reconnect your account.`,
            retryable: false
          }
        );

      case 403:
        return new IntegrationError(
          provider,
          'Insufficient permissions to access data',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: `Insufficient permissions to access your ${provider} data. Please check your account permissions.`,
            retryable: false
          }
        );

      case 429:
        return new IntegrationError(
          provider,
          'Request was rate limited',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: 'Request was rate limited. Please try again in a moment.',
            retryable: true
          }
        );

      case 404:
        return new IntegrationError(
          provider,
          'Resource not found',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: 'The requested resource was not found.',
            retryable: false
          }
        );

      default:
        if (statusCode >= 500) {
          return new IntegrationError(
            provider,
            'Service is temporarily unavailable',
            {
              originalError: error as Error,
              operation,
              context,
              userMessage: `${provider} service is temporarily unavailable. Please try again later.`,
              retryable: true
            }
          );
        }

        return new IntegrationError(
          provider,
          `HTTP ${statusCode} error during ${operation}`,
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: `An error occurred while accessing ${provider}. Please try again.`,
            retryable: statusCode >= 500
          }
        );
    }
  }

  /**
   * Handle provider-specific error codes
   */
  private static handleProviderError(
    error: unknown,
    provider: string,
    operation: string,
    context: Record<string, unknown>,
    errorCode: string
  ): IntegrationError {
    // Microsoft Graph specific errors
    if (provider.includes('Microsoft')) {
      return this.handleMicrosoftGraphError(error, provider, operation, context, errorCode);
    }

    // Google API specific errors
    if (provider.includes('Google')) {
      return this.handleGoogleApiError(error, provider, operation, context, errorCode);
    }

    // Slack specific errors
    if (provider === 'Slack') {
      return this.handleSlackError(error, provider, operation, context, errorCode);
    }

    // Default provider error handling
    return new IntegrationError(
      provider,
      `${errorCode} error during ${operation}`,
      {
        originalError: error as Error,
        operation,
        context,
        userMessage: `An error occurred while accessing ${provider}. Please try again.`,
        retryable: false
      }
    );
  }

  /**
   * Handle Microsoft Graph specific errors
   */
  private static handleMicrosoftGraphError(
    error: unknown,
    provider: string,
    operation: string,
    context: Record<string, unknown>,
    errorCode: string
  ): IntegrationError {
    switch (errorCode) {
      case 'InvalidAuthenticationToken':
        return new IntegrationError(
          provider,
          'Authentication token is invalid or expired',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: 'Your Microsoft account session has expired. Please reconnect your account.',
            retryable: false
          }
        );

      case 'Forbidden':
        return new IntegrationError(
          provider,
          'Insufficient permissions to access data',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: `Insufficient permissions to access your ${provider} data. Please check your account permissions.`,
            retryable: false
          }
        );

      case 'ThrottledRequest':
        return new IntegrationError(
          provider,
          'Request was throttled by Microsoft Graph API',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: 'Request was rate limited. Please try again in a moment.',
            retryable: true
          }
        );

      default:
        return new IntegrationError(
          provider,
          `Microsoft Graph error: ${errorCode}`,
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: `An error occurred while accessing ${provider}. Please try again.`,
            retryable: false
          }
        );
    }
  }

  /**
   * Handle Google API specific errors
   */
  private static handleGoogleApiError(
    error: unknown,
    provider: string,
    operation: string,
    context: Record<string, unknown>,
    errorCode: string
  ): IntegrationError {
    switch (errorCode) {
      case 'UNAUTHENTICATED':
        return new IntegrationError(
          provider,
          'Authentication failed',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: 'Your Google account session has expired. Please reconnect your account.',
            retryable: false
          }
        );

      case 'PERMISSION_DENIED':
        return new IntegrationError(
          provider,
          'Insufficient permissions',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: `Insufficient permissions to access your ${provider} data. Please check your account permissions.`,
            retryable: false
          }
        );

      case 'RESOURCE_EXHAUSTED':
        return new IntegrationError(
          provider,
          'Rate limit exceeded',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: 'Rate limit exceeded. Please try again later.',
            retryable: true
          }
        );

      default:
        return new IntegrationError(
          provider,
          `Google API error: ${errorCode}`,
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: `An error occurred while accessing ${provider}. Please try again.`,
            retryable: false
          }
        );
    }
  }

  /**
   * Handle Slack specific errors
   */
  private static handleSlackError(
    error: unknown,
    provider: string,
    operation: string,
    context: Record<string, unknown>,
    errorCode: string
  ): IntegrationError {
    switch (errorCode) {
      case 'invalid_auth':
        return new IntegrationError(
          provider,
          'Invalid authentication',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: 'Your Slack authentication is invalid. Please reconnect your account.',
            retryable: false
          }
        );

      case 'account_inactive':
        return new IntegrationError(
          provider,
          'Account is inactive',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: 'Your Slack account is inactive. Please contact your administrator.',
            retryable: false
          }
        );

      case 'rate_limited':
        return new IntegrationError(
          provider,
          'Rate limited',
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: 'Request was rate limited. Please try again in a moment.',
            retryable: true
          }
        );

      default:
        return new IntegrationError(
          provider,
          `Slack API error: ${errorCode}`,
          {
            originalError: error as Error,
            operation,
            context,
            userMessage: `An error occurred while accessing ${provider}. Please try again.`,
            retryable: false
          }
        );
    }
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyMessage(
    provider: string,
    operation: string,
    _fallbackMessage: string
  ): string {
    // Try to provide more specific messages based on operation
    if (operation.includes('search')) {
      return `Unable to search your ${provider} data. Please try again.`;
    }
    
    if (operation.includes('get') || operation.includes('fetch')) {
      return `Unable to retrieve data from ${provider}. Please try again.`;
    }
    
    if (operation.includes('send') || operation.includes('create')) {
      return `Unable to send data to ${provider}. Please try again.`;
    }

    return `An error occurred while accessing ${provider}. Please try again.`;
  }
}

/**
 * Convenience function for handling integration errors
 */
export function handleIntegrationError(
  error: unknown,
  provider: string,
  operation: string,
  context: Record<string, unknown> = {},
  userMessage?: string,
  enhancedContext?: EnhancedErrorContext
): IntegrationError {
  return IntegrationErrorHandler.handle(error, {
    provider,
    operation,
    context,
    userMessage,
    enhancedContext
  });
}
