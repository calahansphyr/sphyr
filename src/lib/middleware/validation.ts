/**
 * Validation Middleware for Sphyr API
 * Provides centralized input validation and sanitization
 */

import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { ZodSchema } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/schemas';
import { ValidationError } from '@/lib/errors';

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  headers?: ZodSchema;
  sanitize?: boolean;
  stripUnknown?: boolean;
}

/**
 * Validation middleware factory
 * Creates middleware that validates request data against Zod schemas
 */
export function validateRequest<_T = unknown>(options: ValidationOptions) {
  return (handler: NextApiHandler) => async (
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<void> => {
    try {
      // Validate request body
      if (options.body && req.method !== 'GET' && req.method !== 'HEAD') {
        const bodyResult = options.body.safeParse(req.body);
        if (!bodyResult.success) {
          new ValidationError(
            'Invalid request body',
            'requestBody',
            req.body,
            { validationErrors: bodyResult.error.issues }
          );
          
          logger.warn('Request body validation failed', {
            operation: 'validateRequest',
            endpoint: req.url,
            method: req.method,
            errors: bodyResult.error.issues
          });

          return res.status(400).json(createErrorResponse(
            'Invalid request body',
            'VALIDATION_ERROR',
            bodyResult.error.issues
          ));
        }

        // Sanitize and update request body
        if (options.sanitize !== false) {
          req.body = sanitizeData(bodyResult.data);
        } else {
          req.body = bodyResult.data;
        }
      }

      // Validate query parameters
      if (options.query) {
        const queryResult = options.query.safeParse(req.query);
        if (!queryResult.success) {
          new ValidationError(
            'Invalid query parameters',
            'queryParams',
            req.query,
            { validationErrors: queryResult.error.issues }
          );
          
          logger.warn('Query parameters validation failed', {
            operation: 'validateRequest',
            endpoint: req.url,
            method: req.method,
            errors: queryResult.error.issues
          });

          return res.status(400).json(createErrorResponse(
            'Invalid query parameters',
            'VALIDATION_ERROR',
            queryResult.error.issues
          ));
        }

        req.query = queryResult.data as Record<string, string | string[]>;
      }

      // Validate headers
      if (options.headers) {
        const headersResult = options.headers.safeParse(req.headers);
        if (!headersResult.success) {
          new ValidationError(
            'Invalid request headers',
            'requestHeaders',
            req.headers,
            { validationErrors: headersResult.error.issues }
          );
          
          logger.warn('Request headers validation failed', {
            operation: 'validateRequest',
            endpoint: req.url,
            method: req.method,
            errors: headersResult.error.issues
          });

          return res.status(400).json(createErrorResponse(
            'Invalid request headers',
            'VALIDATION_ERROR',
            headersResult.error.issues
          ));
        }

        req.headers = headersResult.data as Record<string, string | string[] | undefined>;
      }

      // Call the original handler
      await handler(req, res);
    } catch (error) {
      logger.error('Validation middleware error', error as Error, {
        operation: 'validateRequest',
        endpoint: req.url,
        method: req.method
      });

      return res.status(500).json(createErrorResponse(
        'Internal validation error',
        'VALIDATION_ERROR'
      ));
    }
  };
}

/**
 * Sanitize data to prevent XSS and other security issues
 */
function sanitizeData(data: unknown): unknown {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[sanitizeString(key)] = sanitizeData(value);
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Sanitize string to prevent XSS attacks
 */
function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Rate limiting middleware
 */
export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextApiRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (handler: NextApiHandler) => async (
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<void> => {
    const key = options.keyGenerator 
      ? options.keyGenerator(req)
      : req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || 'unknown';
    
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Clean up old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < windowStart) {
        requests.delete(k);
      }
    }
    
    const current = requests.get(key);
    
    if (!current) {
      requests.set(key, { count: 1, resetTime: now + options.windowMs });
    } else if (current.resetTime < now) {
      requests.set(key, { count: 1, resetTime: now + options.windowMs });
    } else if (current.count >= options.maxRequests) {
      logger.warn('Rate limit exceeded', {
        operation: 'rateLimit',
        key,
        count: current.count,
        maxRequests: options.maxRequests,
        endpoint: req.url
      });

      return res.status(429).json(createErrorResponse(
        'Too many requests',
        'RATE_LIMIT_EXCEEDED',
        {
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        }
      ));
    } else {
      current.count++;
    }
    
    // Call the original handler
    await handler(req, res);
    
    // Skip counting based on response status
    if (options.skipSuccessfulRequests && res.statusCode < 400) {
      const current = requests.get(key);
      if (current) {
        current.count = Math.max(0, current.count - 1);
      }
    }
    
    if (options.skipFailedRequests && res.statusCode >= 400) {
      const current = requests.get(key);
      if (current) {
        current.count = Math.max(0, current.count - 1);
      }
    }
  };
}

/**
 * Input sanitization middleware
 */
export function sanitizeInput(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeData(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeData(req.query) as Partial<{ [key: string]: string | string[]; }>;
    }
    
    await handler(req, res);
  };
}

/**
 * Content-Type validation middleware
 */
export function validateContentType(allowedTypes: string[]) {
  return (handler: NextApiHandler) => async (
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<void> => {
    const contentType = req.headers['content-type'];
    
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        logger.warn('Invalid content type', {
          operation: 'validateContentType',
          contentType,
          allowedTypes,
          endpoint: req.url
        });

        return res.status(415).json(createErrorResponse(
          'Unsupported media type',
          'INVALID_CONTENT_TYPE',
          { allowedTypes }
        ));
      }
    }
    
    await handler(req, res);
  };
}

/**
 * Request size validation middleware
 */
export function validateRequestSize(maxSize: number) {
  return (handler: NextApiHandler) => async (
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<void> => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      logger.warn('Request size exceeded', {
        operation: 'validateRequestSize',
        contentLength,
        maxSize,
        endpoint: req.url
      });

      return res.status(413).json(createErrorResponse(
        'Request entity too large',
        'REQUEST_TOO_LARGE',
        { maxSize }
      ));
    }
    
    await handler(req, res);
  };
}
