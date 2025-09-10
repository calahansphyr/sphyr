/**
 * Authentication utility functions
 * Helper functions for authentication-related operations
 */

import { STORAGE_KEYS } from '@/lib/constants';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: string;
  avatar?: string;
}

/**
 * Store authentication tokens in localStorage
 */
export function storeAuthTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEYS.authToken, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);
  localStorage.setItem('sphyr_token_expires', tokens.expiresAt.toString());
}

/**
 * Retrieve authentication tokens from localStorage
 */
export function getAuthTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;
  
  const accessToken = localStorage.getItem(STORAGE_KEYS.authToken);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  const expiresAt = localStorage.getItem('sphyr_token_expires');
  
  if (!accessToken || !refreshToken || !expiresAt) {
    return null;
  }
  
  return {
    accessToken,
    refreshToken,
    expiresAt: parseInt(expiresAt, 10),
  };
}

/**
 * Clear authentication tokens from localStorage
 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.authToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem('sphyr_token_expires');
}

/**
 * Check if the current token is expired
 */
export function isTokenExpired(): boolean {
  const tokens = getAuthTokens();
  if (!tokens) return true;
  
  return Date.now() >= tokens.expiresAt;
}

/**
 * Check if the token needs refresh (within 5 minutes of expiry)
 */
export function needsTokenRefresh(): boolean {
  const tokens = getAuthTokens();
  if (!tokens) return true;
  
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= (tokens.expiresAt - fiveMinutes);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure random string for CSRF tokens
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using Web Crypto API
 */
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
