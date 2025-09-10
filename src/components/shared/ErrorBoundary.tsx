/**
 * React Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { monitoringService } from '../../lib/monitoring';
import { SystemError } from '../../lib/errors';
import { logger } from '../../lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    const { errorId } = this.state;

    // Create a system error for tracking
    const systemError = new SystemError(
      `React component error: ${error.message}`,
      {
        originalError: error,
        errorInfo: {
          componentStack: errorInfo.componentStack,
          errorBoundary: this.constructor.name,
        },
        errorId,
        retryCount: this.state.retryCount,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
      }
    );

    // Report to monitoring service
    monitoringService.reportError({
      error: systemError,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
        retryCount: this.state.retryCount,
      },
      severity: 'high',
      tags: {
        errorType: 'react_component_error',
        errorBoundary: this.constructor.name,
      },
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('React Error Boundary caught error', error, {
        operation: 'error_boundary',
        component: 'ErrorBoundary',
        errorId: errorId,
        retryCount: this.state.retryCount,
        errorInfo: {
          componentStack: errorInfo.componentStack,
          errorBoundary: errorInfo.errorBoundary
        }
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary if props changed and resetOnPropsChange is true
    if (hasError && resetOnPropsChange) {
      const hasResetKeyChanged = resetKeys?.some((key, index) => 
        key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  /**
   * Reset the error boundary state
   */
  resetErrorBoundary = (): void => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // Max retries reached, keep error state
      logger.warn('Error boundary max retries reached, keeping error state', {
        operation: 'error_boundary_retry',
        component: 'ErrorBoundary',
        retryCount: this.state.retryCount,
        maxRetries: 3
      });
    }
  };

  /**
   * Handle retry button click
   */
  handleRetry = (): void => {
    this.resetErrorBoundary();
  };

  /**
   * Handle reload button click
   */
  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): ReactNode {
    const { hasError, error, errorId, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            
            <h1 className="text-lg font-medium text-gray-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-sm text-gray-600 mb-4">
              We&apos;re sorry, but something unexpected happened. Our team has been notified.
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-4 p-3 bg-gray-100 rounded text-left">
                <p className="text-xs text-gray-700 mb-1">
                  <strong>Error ID:</strong> {errorId}
                </p>
                <p className="text-xs text-gray-700 mb-1">
                  <strong>Error:</strong> {error.message}
                </p>
                <p className="text-xs text-gray-700">
                  <strong>Retry Count:</strong> {retryCount}/{maxRetries}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {retryCount < maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reload Page
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              If this problem persists, please contact support.
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook to manually trigger error boundary
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    const systemError = new SystemError(
      `Manual error trigger: ${error.message}`,
      {
        originalError: error,
        errorInfo,
        manualTrigger: true,
      }
    );

    monitoringService.reportError({
      error: systemError,
      context: {
        manualTrigger: true,
        errorInfo,
      },
      severity: 'high',
      tags: {
        errorType: 'manual_error_trigger',
      },
    });

    throw error; // This will trigger the error boundary
  };
}

export default ErrorBoundary;
