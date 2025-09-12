import { describe, it, expect, beforeEach } from 'vitest';
import {
  SphyrError,
  APIError,
  IntegrationError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  SystemError,
  isSphyrError,
  toSphyrError,
  getErrorMessage,
  type ErrorContext,
  type ErrorMetadata,
} from '@/lib/errors';

describe('Error Handling Tests', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('SphyrError Base Class', () => {
    it('should create error with proper metadata and context', () => {
      const context: ErrorContext = {
        userId: 'user-123',
        operation: 'test-operation',
      };
      const metadata: ErrorMetadata = {
        severity: 'high',
        category: 'validation',
        retryable: false,
      };

      const error = new SphyrError('Test error message', metadata, context);

      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('SphyrError');
      expect(error.metadata).toEqual({
        severity: 'high',
        category: 'validation',
        retryable: false,
      });
      expect(error.context).toEqual({
        userId: 'user-123',
        operation: 'test-operation',
        timestamp: expect.any(String),
      });
      expect(error.timestamp).toBeDefined();
      expect(error.id).toBeDefined();
      expect(error.id).toMatch(/^err_\d+_[a-z0-9]+$/);
    });

    it('should apply default metadata values', () => {
      const error = new SphyrError('Test error');

      expect(error.metadata.severity).toBe('medium');
      expect(error.metadata.category).toBe('system');
      expect(error.metadata.retryable).toBe(false);
    });

    it('should generate unique error IDs', () => {
      const error1 = new SphyrError('Error 1');
      const error2 = new SphyrError('Error 2');

      expect(error1.id).not.toBe(error2.id);
      expect(error1.id).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(error2.id).toMatch(/^err_\d+_[a-z0-9]+$/);
    });

    it('should serialize to JSON correctly', () => {
      const context: ErrorContext = {
        userId: 'user-123',
        operation: 'test-operation',
      };
      const metadata: ErrorMetadata = {
        severity: 'high',
        category: 'validation',
      };

      const error = new SphyrError('Test error', metadata, context);
      const json = error.toJSON();

      expect(json).toEqual({
        id: error.id,
        name: 'SphyrError',
        message: 'Test error',
        metadata: {
          severity: 'high',
          category: 'validation',
          retryable: false,
        },
        context: {
          userId: 'user-123',
          operation: 'test-operation',
          timestamp: expect.any(String),
        },
        timestamp: expect.any(String),
        stack: expect.any(String),
      });
    });

    it('should check retryable status correctly', () => {
      const retryableError = new SphyrError('Retryable error', { retryable: true });
      const nonRetryableError = new SphyrError('Non-retryable error', { retryable: false });

      expect(retryableError.isRetryable()).toBe(true);
      expect(nonRetryableError.isRetryable()).toBe(false);
    });

    it('should return user-friendly message', () => {
      const error = new SphyrError('Technical error message');
      expect(error.getUserMessage()).toBe('Technical error message');
    });
  });

  describe('APIError', () => {
    it('should create API error with status code', () => {
      const error = new APIError('Not found', 404);

      expect(error.message).toBe('Not found');
      expect(error.name).toBe('APIError');
      expect(error.metadata.statusCode).toBe(404);
      expect(error.metadata.category).toBe('network');
      expect(error.metadata.retryable).toBe(false);
      expect(error.metadata.severity).toBe('medium');
    });

    it('should set retryable flag for 5xx errors', () => {
      const serverError = new APIError('Internal server error', 500);
      const clientError = new APIError('Bad request', 400);

      expect(serverError.metadata.retryable).toBe(true);
      expect(serverError.metadata.severity).toBe('high');
      expect(clientError.metadata.retryable).toBe(false);
      expect(clientError.metadata.severity).toBe('medium');
    });

    it('should provide user-friendly messages for common status codes', () => {
      const unauthorizedError = new APIError('Unauthorized', 401);
      const forbiddenError = new APIError('Forbidden', 403);
      const notFoundError = new APIError('Not found', 404);
      const serverError = new APIError('Server error', 500);

      expect(unauthorizedError.getUserMessage()).toBe(
        'You are not authorized to perform this action. Please log in again.'
      );
      expect(forbiddenError.getUserMessage()).toBe(
        'You do not have permission to access this resource.'
      );
      expect(notFoundError.getUserMessage()).toBe(
        'The requested resource was not found.'
      );
      expect(serverError.getUserMessage()).toBe(
        'A server error occurred. Please try again later.'
      );
    });

    it('should fall back to original message for unknown status codes', () => {
      const customError = new APIError('Custom error message', 418);
      expect(customError.getUserMessage()).toBe('Custom error message');
    });
  });

  describe('IntegrationError', () => {
    it('should create integration error with provider context', () => {
      const error = new IntegrationError('google', 'API rate limit exceeded');

      expect(error.message).toBe('API rate limit exceeded');
      expect(error.name).toBe('IntegrationError');
      expect(error.provider).toBe('google');
      expect(error.metadata.category).toBe('integration');
      expect(error.metadata.retryable).toBe(true);
      expect(error.metadata.severity).toBe('medium');
    });

    it('should provide user-friendly message with provider context', () => {
      const error = new IntegrationError('slack', 'Connection failed');
      expect(error.getUserMessage()).toBe(
        'There was an issue connecting to slack. Please try again or contact support if the problem persists.'
      );
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field context', () => {
      const error = new ValidationError('Invalid email format', 'email', 'invalid-email');

      expect(error.message).toBe('Invalid email format');
      expect(error.name).toBe('ValidationError');
      expect(error.field).toBe('email');
      expect(error.value).toBe('invalid-email');
      expect(error.metadata.category).toBe('validation');
      expect(error.metadata.retryable).toBe(false);
      expect(error.metadata.severity).toBe('low');
    });

    it('should provide user-friendly message with field context', () => {
      const error = new ValidationError('Invalid format', 'email', 'invalid-email');
      expect(error.getUserMessage()).toBe('Invalid email: Invalid format');
    });

    it('should provide user-friendly message without field context', () => {
      const error = new ValidationError('Invalid format');
      expect(error.getUserMessage()).toBe('Invalid format');
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with proper metadata', () => {
      const error = new AuthenticationError('Invalid credentials');

      expect(error.message).toBe('Invalid credentials');
      expect(error.name).toBe('AuthenticationError');
      expect(error.metadata.category).toBe('authentication');
      expect(error.metadata.retryable).toBe(false);
      expect(error.metadata.severity).toBe('high');
    });

    it('should use default message when none provided', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication failed');
    });

    it('should provide user-friendly message', () => {
      const error = new AuthenticationError('Invalid token');
      expect(error.getUserMessage()).toBe('Please log in to continue.');
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error with proper metadata', () => {
      const error = new AuthorizationError('Insufficient permissions');

      expect(error.message).toBe('Insufficient permissions');
      expect(error.name).toBe('AuthorizationError');
      expect(error.metadata.category).toBe('authorization');
      expect(error.metadata.retryable).toBe(false);
      expect(error.metadata.severity).toBe('high');
    });

    it('should use default message when none provided', () => {
      const error = new AuthorizationError();
      expect(error.message).toBe('Access denied');
    });

    it('should provide user-friendly message', () => {
      const error = new AuthorizationError('No permission');
      expect(error.getUserMessage()).toBe('You do not have permission to perform this action.');
    });
  });

  describe('NetworkError', () => {
    it('should create network error with proper metadata', () => {
      const error = new NetworkError('Connection timeout');

      expect(error.message).toBe('Connection timeout');
      expect(error.name).toBe('NetworkError');
      expect(error.metadata.category).toBe('network');
      expect(error.metadata.retryable).toBe(true);
      expect(error.metadata.severity).toBe('medium');
    });

    it('should use default message when none provided', () => {
      const error = new NetworkError();
      expect(error.message).toBe('Network error occurred');
    });

    it('should provide user-friendly message', () => {
      const error = new NetworkError('Connection failed');
      expect(error.getUserMessage()).toBe('Please check your internet connection and try again.');
    });
  });

  describe('SystemError', () => {
    it('should create system error with proper metadata', () => {
      const error = new SystemError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
      expect(error.name).toBe('SystemError');
      expect(error.metadata.category).toBe('system');
      expect(error.metadata.retryable).toBe(true);
      expect(error.metadata.severity).toBe('critical');
    });

    it('should use default message when none provided', () => {
      const error = new SystemError();
      expect(error.message).toBe('An unexpected system error occurred');
    });

    it('should provide user-friendly message', () => {
      const error = new SystemError('Database error');
      expect(error.getUserMessage()).toBe('An unexpected error occurred. Our team has been notified.');
    });
  });

  describe('Utility Functions', () => {
    describe('isSphyrError', () => {
      it('should return true for SphyrError instances', () => {
        const sphyrError = new SphyrError('Test error');
        const apiError = new APIError('API error', 500);
        const validationError = new ValidationError('Validation error');

        expect(isSphyrError(sphyrError)).toBe(true);
        expect(isSphyrError(apiError)).toBe(true);
        expect(isSphyrError(validationError)).toBe(true);
      });

      it('should return false for non-SphyrError instances', () => {
        const nativeError = new Error('Native error');
        const stringError = 'String error';
        const nullError = null;
        const undefinedError = undefined;

        expect(isSphyrError(nativeError)).toBe(false);
        expect(isSphyrError(stringError)).toBe(false);
        expect(isSphyrError(nullError)).toBe(false);
        expect(isSphyrError(undefinedError)).toBe(false);
      });
    });

    describe('toSphyrError', () => {
      it('should return SphyrError instances unchanged', () => {
        const originalError = new SphyrError('Original error');
        const convertedError = toSphyrError(originalError);

        expect(convertedError).toBe(originalError);
      });

      it('should convert native Error to SystemError', () => {
        const nativeError = new Error('Native error message');
        const context: ErrorContext = { operation: 'test' };
        const convertedError = toSphyrError(nativeError, context);

        expect(convertedError).toBeInstanceOf(SystemError);
        expect(convertedError.message).toBe('Native error message');
        expect(convertedError.context.operation).toBe('test');
        expect(convertedError.context.originalError).toBe(nativeError);
      });

      it('should convert string to SystemError', () => {
        const stringError = 'String error message';
        const convertedError = toSphyrError(stringError);

        expect(convertedError).toBeInstanceOf(SystemError);
        expect(convertedError.message).toBe('String error message');
      });

      it('should convert other types to SystemError', () => {
        const numberError = 42;
        const objectError = { message: 'Object error' };
        const convertedNumberError = toSphyrError(numberError);
        const convertedObjectError = toSphyrError(objectError);

        expect(convertedNumberError).toBeInstanceOf(SystemError);
        expect(convertedNumberError.message).toBe('42');

        expect(convertedObjectError).toBeInstanceOf(SystemError);
        expect(convertedObjectError.message).toBe('[object Object]');
      });
    });

    describe('getErrorMessage', () => {
      it('should return user message for SphyrError instances', () => {
        const sphyrError = new SphyrError('Sphyr error message');
        const apiError = new APIError('API error', 404);

        expect(getErrorMessage(sphyrError)).toBe('Sphyr error message');
        expect(getErrorMessage(apiError)).toBe('The requested resource was not found.');
      });

      it('should return message for native Error instances', () => {
        const nativeError = new Error('Native error message');
        expect(getErrorMessage(nativeError)).toBe('Native error message');
      });

      it('should convert other types to string', () => {
        expect(getErrorMessage('String error')).toBe('String error');
        expect(getErrorMessage(42)).toBe('42');
        expect(getErrorMessage(null)).toBe('null');
        expect(getErrorMessage(undefined)).toBe('undefined');
      });
    });
  });

  describe('Error Inheritance and Polymorphism', () => {
    it('should maintain proper inheritance chain', () => {
      const apiError = new APIError('API error', 500);
      const integrationError = new IntegrationError('google', 'Integration error');
      const validationError = new ValidationError('Validation error');

      expect(apiError).toBeInstanceOf(SphyrError);
      expect(apiError).toBeInstanceOf(APIError);
      expect(integrationError).toBeInstanceOf(SphyrError);
      expect(integrationError).toBeInstanceOf(IntegrationError);
      expect(validationError).toBeInstanceOf(SphyrError);
      expect(validationError).toBeInstanceOf(ValidationError);
    });

    it('should preserve error context through inheritance', () => {
      const context: ErrorContext = { userId: 'user-123' };
      const apiError = new APIError('API error', 500, context);

      expect(apiError.context.userId).toBe('user-123');
      expect(apiError.context.timestamp).toBeDefined();
    });
  });

  describe('Error Stack Traces', () => {
    it('should preserve stack traces for debugging', () => {
      const error = new SphyrError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('SphyrError');
    });

    it('should include stack trace in JSON serialization', () => {
      const error = new SphyrError('Test error');
      const json = error.toJSON();
      expect(json.stack).toBeDefined();
      expect(json.stack).toContain('SphyrError');
    });
  });
});
