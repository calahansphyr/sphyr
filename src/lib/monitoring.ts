/**
 * Global Error Monitoring and Reporting Service
 * Centralized error tracking with Sentry integration
 */

import { SphyrError, isSphyrError, toSphyrError } from './errors';
// import { APP_CONFIG } from './constants';

// Sentry will be imported dynamically to avoid bundle bloat in development
let Sentry: unknown = null;

// Initialize Sentry in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  import('@sentry/nextjs').then((sentryModule) => {
    Sentry = sentryModule;
    
    (Sentry as typeof import('@sentry/nextjs')).init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
      beforeSend(event: import('@sentry/nextjs').ErrorEvent) {
        // Filter out non-critical errors in production
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.type === 'ChunkLoadError' || error?.type === 'Loading chunk') {
            return null; // Don't report chunk load errors
          }
        }
        return event;
      },
    });
  }).catch((error) => {
    console.warn('Failed to initialize Sentry:', error);
  });
}

export interface ErrorReport {
  error: Error | SphyrError;
  context?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  tags?: Record<string, string>;
  user?: {
    id?: string;
    email?: string;
    organizationId?: string;
  };
  extra?: Record<string, unknown>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

/**
 * Global error reporting service
 */
class MonitoringService {
  private isInitialized = false;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 50;

  /**
   * Initialize the monitoring service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // In development, just log to console
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Monitoring service initialized (development mode)');
        this.isInitialized = true;
        return;
      }

      // In production, wait for Sentry to be available
      if (typeof window !== 'undefined') {
        // Wait up to 5 seconds for Sentry to initialize
        let attempts = 0;
        while (!Sentry && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (Sentry) {
          console.log('🔍 Monitoring service initialized with Sentry');
        } else {
          console.warn('⚠️ Sentry failed to initialize, falling back to console logging');
        }
      }

      this.isInitialized = true;

      // Process any queued errors
      this.processErrorQueue();
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error);
      this.isInitialized = true; // Mark as initialized to prevent infinite retries
    }
  }

  /**
   * Report an error to the monitoring service
   */
  async reportError(report: ErrorReport): Promise<void> {
    const sphyrError = isSphyrError(report.error) ? report.error : toSphyrError(report.error, report.context);

    // Add to queue if not initialized yet
    if (!this.isInitialized) {
      this.errorQueue.push(report);
      if (this.errorQueue.length > this.maxQueueSize) {
        this.errorQueue.shift(); // Remove oldest error
      }
      return;
    }

    try {
      // In development, log to console with detailed information
      if (process.env.NODE_ENV === 'development') {
        this.logErrorToConsole(sphyrError, report);
        return;
      }

      // In production, send to Sentry
      if (Sentry) {
        await this.sendToSentry(sphyrError, report);
      } else {
        // Fallback to console if Sentry is not available
        this.logErrorToConsole(sphyrError, report);
      }
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  /**
   * Log error to console (development mode)
   */
  private logErrorToConsole(error: SphyrError, report: ErrorReport): void {
    // const timestamp = new Date().toISOString();
    // const errorInfo = {
    //   timestamp,
    //   id: error.id,
    //   name: error.name,
    //   message: error.message,
    //   severity: error.metadata.severity,
    //   category: error.metadata.category,
    //   context: error.context,
    //   stack: error.stack,
    //   user: report.user,
    //   tags: report.tags,
    //   extra: report.extra,
    // };

    console.group(`🚨 ${error.metadata.severity?.toUpperCase()} ERROR: ${error.name}`);
    console.error('Message:', error.message);
    console.error('ID:', error.id);
    console.error('Severity:', error.metadata.severity);
    console.error('Category:', error.metadata.category);
    console.error('Retryable:', error.isRetryable());
    console.error('Context:', error.context);
    console.error('Stack:', error.stack);
    
    if (report.user) {
      console.error('User:', report.user);
    }
    
    if (report.tags) {
      console.error('Tags:', report.tags);
    }
    
    if (report.extra) {
      console.error('Extra:', report.extra);
    }
    
    console.groupEnd();
  }

  /**
   * Send error to Sentry (production mode)
   */
  private async sendToSentry(error: SphyrError, report: ErrorReport): Promise<void> {
    if (!Sentry) return;

    try {
      const sentry = Sentry as typeof import('@sentry/nextjs');
      
      // Set user context
      if (report.user) {
        sentry.setUser(report.user);
      }

      // Set tags
      const tags = {
        errorId: error.id,
        errorCategory: error.metadata.category,
        errorSeverity: error.metadata.severity,
        retryable: error.isRetryable().toString(),
        ...report.tags,
      };

      // Set extra context
      const extra = {
        errorContext: error.context,
        errorMetadata: error.metadata,
        ...report.extra,
      };

      // Capture the error
      sentry.withScope((scope: unknown) => {
        const sentryScope = scope as import('@sentry/nextjs').Scope;
        sentryScope.setTags(tags);
        sentryScope.setExtras(extra);
        sentryScope.setLevel(this.mapSeverityToSentryLevel(error.metadata.severity));
        
        sentry.captureException(error);
      });
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
    }
  }

  /**
   * Map our severity levels to Sentry levels
   */
  private mapSeverityToSentryLevel(severity?: string): import('@sentry/nextjs').SeverityLevel {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'fatal';
      default: return 'error';
    }
  }

  /**
   * Process queued errors after initialization
   */
  private async processErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    console.log(`📤 Processing ${this.errorQueue.length} queued errors`);
    
    const errorsToProcess = [...this.errorQueue];
    this.errorQueue = [];

    for (const report of errorsToProcess) {
      await this.reportError(report);
    }
  }

  /**
   * Track performance metrics
   */
  async trackMetric(metric: PerformanceMetric): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // In development, log to console
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Performance Metric:', metric);
        return;
      }

      // In production, send to Sentry
      if (Sentry) {
        const sentry = Sentry as typeof import('@sentry/nextjs');
        sentry.addBreadcrumb({
          category: 'performance',
          message: metric.name,
          data: {
            value: metric.value,
            unit: metric.unit,
            tags: metric.tags,
          },
          level: 'info',
        });
      }
    } catch (error) {
      console.error('Failed to track metric:', error);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id?: string; email?: string; organizationId?: string }): void {
    if (Sentry) {
      const sentry = Sentry as typeof import('@sentry/nextjs');
      sentry.setUser(user);
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (Sentry) {
      const sentry = Sentry as typeof import('@sentry/nextjs');
      sentry.setUser(null);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string = 'custom', data?: Record<string, unknown>): void {
    if (Sentry) {
      const sentry = Sentry as typeof import('@sentry/nextjs');
      sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
      });
    }
  }

  /**
   * Capture a message (non-error)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (Sentry) {
      const sentry = Sentry as typeof import('@sentry/nextjs');
      sentry.captureMessage(message, level);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`📝 ${level.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Get the current error queue (for debugging)
   */
  getErrorQueue(): ErrorReport[] {
    return [...this.errorQueue];
  }

  /**
   * Clear the error queue
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

/**
 * Convenience function to report errors
 */
export async function reportError(error: Error | SphyrError, context?: Record<string, unknown>): Promise<void> {
  await monitoringService.reportError({
    error,
    context,
  });
}

/**
 * Convenience function to track performance metrics
 */
export async function trackMetric(name: string, value: number, unit?: string, tags?: Record<string, string>): Promise<void> {
  await monitoringService.trackMetric({
    name,
    value,
    unit,
    tags,
  });
}

/**
 * Initialize monitoring service (call this early in your app)
 */
export async function initializeMonitoring(): Promise<void> {
  await monitoringService.initialize();
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  initializeMonitoring().catch(console.error);
}
