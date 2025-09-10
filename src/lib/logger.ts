/**
 * Structured Logging Service for Sphyr
 * Provides consistent, contextual logging across the application
 */

import { reportError } from './monitoring';
import { piiScrubber, PIIScrubber } from './logger/pii-scrubber';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  operation?: string;
  endpoint?: string;
  integration?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: string;
  service: string;
}

export interface PerformanceTimer {
  label: string;
  startTime: number;
}

/**
 * Structured Logger Service
 * Replaces console.log with structured, contextual logging
 */
export class LoggerService {
  private context: LogContext = {};
  private requestId?: string;
  private timers = new Map<string, PerformanceTimer>();
  private serviceName = 'sphyr';
  private piiScrubber: PIIScrubber;

  constructor(customPIIScrubber?: PIIScrubber) {
    this.piiScrubber = customPIIScrubber || piiScrubber;
  }

  /**
   * Set global context for all subsequent logs
   */
  setContext(context: LogContext): void {
    // Scrub PII from context before storing
    this.context = this.piiScrubber.scrub({ ...this.context, ...context }) as LogContext;
  }

  /**
   * Set request ID for correlation
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
    this.context.requestId = requestId;
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
    this.requestId = undefined;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    } : {};
    
    this.log('error', message, { ...errorContext, ...context });
    
    // Also report to monitoring service for errors
    if (error) {
      reportError(error, {
        ...this.context,
        ...context,
        logMessage: message,
      }).catch(console.error);
    }
  }

  /**
   * Start a performance timer
   */
  time(label: string): void {
    this.timers.set(label, {
      label,
      startTime: Date.now(),
    });
  }

  /**
   * End a performance timer and log the duration
   */
  timeEnd(label: string): number {
    const timer = this.timers.get(label);
    if (!timer) {
      this.warn(`Timer '${label}' was not started`);
      return 0;
    }

    const duration = Date.now() - timer.startTime;
    this.timers.delete(label);
    
    this.info(`Timer '${label}' completed`, { duration });
    return duration;
  }

  /**
   * Log API request start
   */
  logRequestStart(method: string, url: string, context?: LogContext): void {
    this.info('API request started', {
      method,
      url,
      ...context,
    });
  }

  /**
   * Log API request completion
   */
  logRequestEnd(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.log(level, 'API request completed', {
      method,
      url,
      statusCode,
      duration,
      ...context,
    });
  }

  /**
   * Log integration call start
   */
  logIntegrationStart(integration: string, operation: string, context?: LogContext): void {
    this.info('Integration call started', {
      integration,
      operation,
      ...context,
    });
  }

  /**
   * Log integration call completion
   */
  logIntegrationEnd(integration: string, operation: string, success: boolean, duration: number, context?: LogContext): void {
    const level = success ? 'info' : 'warn';
    this.log(level, 'Integration call completed', {
      integration,
      operation,
      success,
      duration,
      ...context,
    });
  }

  /**
   * Core logging method with PII scrubbing
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Scrub PII from all context data
    const scrubbedContext = this.piiScrubber.scrub({ ...this.context, ...context });
    
    const logEntry: LogEntry = {
      level,
      message,
      context: scrubbedContext as LogContext,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
    };

    // In development, use pretty formatting
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(logEntry);
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Pretty console logging for development
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, context, timestamp } = entry;
    const time = new Date(timestamp).toLocaleTimeString();
    
    // Color coding for different levels
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    
    const reset = '\x1b[0m';
    const color = colors[level] || '';
    
    // Format the log message
    let logMessage = `${color}[${time}] ${level.toUpperCase()}: ${message}${reset}`;
    
    // Add context if present
    if (Object.keys(context).length > 0) {
      logMessage += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }
    
    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
    }
  }
}

// Create singleton instance
export const logger = new LoggerService();

// Utility function to generate request IDs
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Utility function to create request logger middleware
export function createRequestLogger() {
  return (req: { method: string; url: string; headers: Record<string, string | string[] | undefined>; connection?: { remoteAddress?: string } }, res: { end: (chunk?: unknown, encoding?: string) => void; statusCode: number }, next?: () => void) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // Set up logging context
    logger.setRequestId(requestId);
    logger.logRequestStart(req.method, req.url, {
      userAgent: req.headers?.['user-agent'],
      ip: req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress,
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: unknown, encoding?: string) {
      const duration = Date.now() - startTime;
      logger.logRequestEnd(req.method, req.url, res.statusCode, duration);
      originalEnd.call(this, chunk, encoding);
    };
    
    if (next) {
      next();
    }
  };
}
