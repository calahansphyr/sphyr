/**
 * Central type definitions for Sphyr
 * Re-exports all type definitions for easy importing
 */

// Re-export all existing types
export * from './ai';
export * from './construction';
export * from './integrations';

// Common application types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'boolean';
  options?: SelectOption[];
}

// Theme and UI types
export type Theme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: Theme;
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    search: boolean;
  };
}

// Search and integration types
export interface SearchFilters {
  sources?: string[];
  types?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  organizationId?: string;
}

export interface IntegrationStatus {
  connected: boolean;
  lastSync?: string;
  error?: string;
  config?: Record<string, unknown>;
}
