/**
 * API Client for Sphyr
 * Centralized HTTP client with authentication, error handling, and retry logic
 */

import { API_CONFIG, ERROR_MESSAGES } from './constants';
import { UserProfile } from '@/types/user';
// import type { ApiError } from '@/types';
import { APIError, NetworkError } from './errors';
import { reportError } from './monitoring';

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authentication token
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Make HTTP request with error handling and retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError = new APIError(
          errorData.message || ERROR_MESSAGES.serverError,
          response.status,
          {
            url,
            method: config.method || 'GET',
            statusText: response.statusText,
            responseHeaders: Object.fromEntries(response.headers.entries()),
          }
        );
        
        // Report API errors for monitoring
        await reportError(apiError, {
          endpoint,
          method: config.method || 'GET',
          statusCode: response.status,
        });
        
        throw apiError;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // If it's already a SphyrError, re-throw it
      if (error instanceof APIError || error instanceof NetworkError) {
        throw error;
      }

      // Network or timeout error - retry if attempts remaining
      if (retryCount < API_CONFIG.retryAttempts) {
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      // Create a network error for the final failure
      const networkError = new NetworkError(
        error instanceof Error ? error.message : ERROR_MESSAGES.network,
        {
          url,
          method: config.method || 'GET',
          retryCount,
          originalError: error instanceof Error ? error : undefined,
        }
      );

      // Report network errors for monitoring
      await reportError(networkError, {
        endpoint,
        method: config.method || 'GET',
        retryCount,
      });

      throw networkError;
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Fetch user profile from the API
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  try {
    const response = await fetch('/api/user/profile');
    
    if (!response.ok) {
      const apiError = new APIError(
        'Failed to fetch user profile',
        response.status,
        {
          url: '/api/user/profile',
          method: 'GET',
          statusText: response.statusText,
        }
      );
      
      await reportError(apiError, {
        endpoint: '/api/user/profile',
        operation: 'fetchUserProfile',
      });
      
      throw apiError;
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    const networkError = new NetworkError(
      'Failed to fetch user profile',
      {
        originalError: error instanceof Error ? error : undefined,
        operation: 'fetchUserProfile',
      }
    );
    
    await reportError(networkError, {
      endpoint: '/api/user/profile',
      operation: 'fetchUserProfile',
    });
    
    throw networkError;
  }
}

/**
 * Search API function
 */
export async function postSearchQuery(query: string): Promise<{
  message: string;
  data: Array<{
    id: number;
    title: string;
    content: string;
    source: string;
    url?: string;
  }>;
  query: string;
  timestamp: string;
}> {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const apiError = new APIError(
        'Failed to perform search',
        response.status,
        {
          url: '/api/search',
          method: 'POST',
          statusText: response.statusText,
          query,
        }
      );
      
      await reportError(apiError, {
        endpoint: '/api/search',
        operation: 'postSearchQuery',
        query,
      });
      
      throw apiError;
    }

    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    const networkError = new NetworkError(
      'Failed to perform search',
      {
        originalError: error instanceof Error ? error : undefined,
        operation: 'postSearchQuery',
        query,
      }
    );
    
    await reportError(networkError, {
      endpoint: '/api/search',
      operation: 'postSearchQuery',
      query,
    });
    
    throw networkError;
  }
}
