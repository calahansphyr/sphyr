/**
 * Next.js Middleware for Sphyr
 * Handles authentication, route protection, rate limiting, and request processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: {
    api: 100, // 100 requests per window for API routes
    search: 20, // 20 search requests per window
    auth: 10, // 10 auth requests per window
  },
};

// In-memory rate limit store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

/**
 * Check rate limit for a client
 */
function checkRateLimit(
  clientIP: string, 
  route: string, 
  maxRequests: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = RATE_LIMIT_CONFIG.windowMs;
  const key = `${clientIP}:${route}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // New window or expired window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }
  
  if (current.count >= maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }
  
  // Increment counter
  current.count++;
  rateLimitStore.set(key, current);
  
  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Get rate limit configuration for a route
 */
function getRateLimitConfig(pathname: string): number {
  if (pathname.startsWith('/api/search')) {
    return RATE_LIMIT_CONFIG.maxRequests.search;
  }
  if (pathname.startsWith('/api/auth')) {
    return RATE_LIMIT_CONFIG.maxRequests.auth;
  }
  if (pathname.startsWith('/api/')) {
    return RATE_LIMIT_CONFIG.maxRequests.api;
  }
  
  return RATE_LIMIT_CONFIG.maxRequests.api; // Default
}

// Protected routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/search',
  '/api/integrations',
  '/api/user',
];

/**
 * Check if an API route is protected
 */
function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if user is authenticated
 */
function isAuthenticated(request: NextRequest): boolean {
  // Check for auth token in cookies or headers
  const authToken = request.cookies.get('sphyr_auth_token')?.value;
  const authHeader = request.headers.get('authorization');
  
  return !!(authToken || authHeader?.startsWith('Bearer '));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/site.webmanifest'
  ) {
    return NextResponse.next();
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request);
    const maxRequests = getRateLimitConfig(pathname);
    
    // Apply rate limiting
    const rateLimit = checkRateLimit(clientIP, pathname, maxRequests);
    
    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());
      response.headers.set('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString());
      
      return response;
    }

    // Skip auth check for health and auth routes
    if (
      pathname.startsWith('/api/health') ||
      pathname.startsWith('/api/auth')
    ) {
      const response = NextResponse.next();
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());
      
      return response;
    }

    // Check authentication for protected API routes
    if (isProtectedApiRoute(pathname) && !isAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Add CORS headers for API routes
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());
    
    return response;
  }

  // Use Supabase session management for page routes
  const supabaseResponse = await updateSession(request);
  
  // Add security headers to the response
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.supabase.co https://*.supabase.co",
    "frame-ancestors 'none'",
  ].join('; ');
  
  supabaseResponse.headers.set('Content-Security-Policy', csp);

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};