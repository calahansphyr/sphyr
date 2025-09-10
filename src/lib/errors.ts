/**
 * Standardized Error Classes for Sphyr
 * Provides consistent error handling across the entire application
 */

export interface ErrorContext {
  [key: string]: unknown;
  originalError?: Error;
  timestamp?: string;
  userId?: string;
  organizationId?: string;
  requestId?: string;
}

export interface ErrorMetadata {
  code?: string;
  statusCode?: number;
  retryable?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'network' | 'validation' | 'authentication' | 'authorization' | 'integration' | 'system';
}

/**
 * Base error class for all Sphyr errors
 * Extends native Error with additional context and metadata
 */
export class SphyrError extends Error {
  public readonly context: ErrorContext;
  public readonly metadata: ErrorMetadata;
  public readonly timestamp: string;
  public readonly id: string;

  constructor(
    message: string,
    metadata: ErrorMetadata = {},
    context: ErrorContext = {}
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.metadata = {
      severity: 'medium',
      category: 'system',
      retryable: false,
      ...metadata,
    };
    this.context = {
      timestamp: new Date().toISOString(),
      ...context,
    };
    this.timestamp = this.context.timestamp || new Date().toISOString();
    this.id = this.generateErrorId();

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Generate a unique error ID for tracking
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert error to a plain object for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      metadata: this.metadata,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Check if this error is retryable
   */
  isRetryable(): boolean {
    return this.metadata.retryable === true;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.message;
  }
}

/**
 * API-related errors (HTTP requests, API responses)
 */
export class APIError extends SphyrError {
  constructor(
    message: string,
    statusCode?: number,
    context: ErrorContext = {}
  ) {
    super(message, {
      category: 'network',
      statusCode,
      retryable: statusCode ? statusCode >= 500 : false,
      severity: statusCode ? (statusCode >= 500 ? 'high' : 'medium') : 'medium',
    }, context);
  }

  getUserMessage(): string {
    if (this.metadata.statusCode === 401) {
      return 'You are not authorized to perform this action. Please log in again.';
    }
    if (this.metadata.statusCode === 403) {
      return 'You do not have permission to access this resource.';
    }
    if (this.metadata.statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (this.metadata.statusCode && this.metadata.statusCode >= 500) {
      return 'A server error occurred. Please try again later.';
    }
    return this.message;
  }
}

/**
 * Integration-specific errors (third-party services)
 */
export class IntegrationError extends SphyrError {
  public readonly provider: string;

  constructor(
    provider: string,
    message: string,
    context: ErrorContext = {}
  ) {
    super(message, {
      category: 'integration',
      retryable: true,
      severity: 'medium',
    }, context);
    
    this.provider = provider;
  }

  getUserMessage(): string {
    return `There was an issue connecting to ${this.provider}. Please try again or contact support if the problem persists.`;
  }
}

/**
 * Validation errors (input validation, data validation)
 */
export class ValidationError extends SphyrError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    context: ErrorContext = {}
  ) {
    super(message, {
      category: 'validation',
      retryable: false,
      severity: 'low',
    }, context);
    
    this.field = field;
    this.value = value;
  }

  getUserMessage(): string {
    if (this.field) {
      return `Invalid ${this.field}: ${this.message}`;
    }
    return this.message;
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends SphyrError {
  constructor(
    message: string = 'Authentication failed',
    context: ErrorContext = {}
  ) {
    super(message, {
      category: 'authentication',
      retryable: false,
      severity: 'high',
    }, context);
  }

  getUserMessage(): string {
    return 'Please log in to continue.';
  }
}

/**
 * Authorization errors (permissions, access control)
 */
export class AuthorizationError extends SphyrError {
  constructor(
    message: string = 'Access denied',
    context: ErrorContext = {}
  ) {
    super(message, {
      category: 'authorization',
      retryable: false,
      severity: 'high',
    }, context);
  }

  getUserMessage(): string {
    return 'You do not have permission to perform this action.';
  }
}

/**
 * Network-related errors (connection issues, timeouts)
 */
export class NetworkError extends SphyrError {
  constructor(
    message: string = 'Network error occurred',
    context: ErrorContext = {}
  ) {
    super(message, {
      category: 'network',
      retryable: true,
      severity: 'medium',
    }, context);
  }

  getUserMessage(): string {
    return 'Please check your internet connection and try again.';
  }
}

/**
 * System errors (unexpected errors, infrastructure issues)
 */
export class SystemError extends SphyrError {
  constructor(
    message: string = 'An unexpected system error occurred',
    context: ErrorContext = {}
  ) {
    super(message, {
      category: 'system',
      retryable: true,
      severity: 'critical',
    }, context);
  }

  getUserMessage(): string {
    return 'An unexpected error occurred. Our team has been notified.';
  }
}

/**
 * Utility function to determine if an error is a SphyrError
 */
export function isSphyrError(error: unknown): error is SphyrError {
  return error instanceof SphyrError;
}

/**
 * Utility function to convert any error to a SphyrError
 */
export function toSphyrError(error: unknown, context: ErrorContext = {}): SphyrError {
  if (isSphyrError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new SystemError(error.message, {
      ...context,
      originalError: error,
    });
  }

  return new SystemError(String(error), context);
}

/**
 * Utility function to extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (isSphyrError(error)) {
    return error.getUserMessage();
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}
