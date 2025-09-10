/**
 * Search Orchestrator Service - MVP Version
 * Handles parallel execution of integration searches with basic health monitoring
 * Follows DRY principles by centralizing search logic and eliminating duplication
 */

import { logger } from '../logger';
import { executeWithResilience, DEFAULT_TIMEOUT_CONFIG, DEFAULT_RETRY_CONFIG } from '../resilience';
import { AdapterFactory, type AllAdapters } from '../integrations/adapter-factory';

// Simple interfaces for MVP
export interface SearchResult {
  integration: string;
  service: string;
  success: boolean;
  data: unknown;
  duration: number;
  error?: string;
}

export type IntegrationHealth = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Search Orchestrator Class - MVP Version
 * Centralizes all search execution logic following DRY principles
 */
export class SearchOrchestrator {
  private integrationHealth = new Map<string, IntegrationHealth>();

  /**
   * Execute all integration searches with enhanced resilience
   * This is the main entry point that replaces the complex logic in the search API
   */
  async executeAllSearches(
    adapters: AllAdapters,
    searchQuery: string,
    requestId: string
  ): Promise<SearchResult[]> {
    const startTime = Date.now();
    
    logger.info('Starting orchestrated integration searches', { 
      searchQuery, 
      availableAdapters: AdapterFactory.getAvailableAdapters(adapters),
      requestId 
    });

    // Build all search promises using DRY principle
    const searchPromises = this.buildAllSearchPromises(adapters, searchQuery, requestId);

    // Execute all searches in parallel
    const results = await Promise.allSettled(searchPromises);
    
    const totalDuration = Date.now() - startTime;
    
    // Process results and update health status
    const processedResults = this.processSearchResults(results, totalDuration, requestId);

    return processedResults;
  }

  /**
   * Build all search promises for available integrations
   * Uses DRY principle by centralizing promise creation logic
   */
  private buildAllSearchPromises(
    adapters: AllAdapters,
    searchQuery: string,
    requestId: string
  ): Promise<SearchResult>[] {
    const promises: Promise<SearchResult>[] = [];

    // Google services (always available)
    promises.push(...this.createGoogleSearchPromises(adapters.google, searchQuery, requestId));

    // Optional integrations
    if (adapters.slack) {
      promises.push(this.createSearchPromise(
        'slack',
        'searchMessages',
        () => adapters.slack!.searchMessages({ query: searchQuery, limit: 5 }),
        requestId
      ));
    }

    if (adapters.asana) {
      promises.push(this.createSearchPromise(
        'asana',
        'searchTasks',
        () => adapters.asana!.searchTasks({ query: searchQuery, limit: 5 }),
        requestId
      ));
    }

    if (adapters.quickbooks) {
      promises.push(...this.createQuickBooksSearchPromises(adapters.quickbooks, searchQuery, requestId));
    }

    if (this.hasMicrosoftIntegrations(adapters.microsoft)) {
      promises.push(...this.createMicrosoftSearchPromises(adapters.microsoft, searchQuery, requestId));
    }

    if (adapters.procore) {
      promises.push(...this.createProcoreSearchPromises(adapters.procore, searchQuery, requestId));
    }

    return promises;
  }

  /**
   * Create Google search promises
   * Centralizes Google service search logic
   */
  private createGoogleSearchPromises(
    googleAdapters: AllAdapters['google'],
    searchQuery: string,
    requestId: string
  ): Promise<SearchResult>[] {
    const googleServices = [
      { service: 'gmail', method: 'searchMessages', limit: 5 },
      { service: 'drive', method: 'searchFiles', limit: 5 },
      { service: 'calendar', method: 'searchEvents', limit: 5 },
      { service: 'docs', method: 'searchFiles', limit: 3 },
      { service: 'sheets', method: 'searchFiles', limit: 3 },
      { service: 'people', method: 'searchContacts', limit: 5 },
    ];

    return googleServices.map(({ service, method, limit }) =>
      this.createSearchPromise(
        'google',
        service,
        () => (googleAdapters as unknown as Record<string, Record<string, (params: { query: string; limit: number }) => Promise<unknown>>>)[service][method]({ query: searchQuery, limit }),
        requestId
      )
    );
  }

  /**
   * Create QuickBooks search promises
   * Centralizes QuickBooks service search logic
   */
  private createQuickBooksSearchPromises(
    quickbooksAdapter: NonNullable<AllAdapters['quickbooks']>,
    searchQuery: string,
    requestId: string
  ): Promise<SearchResult>[] {
    const quickbooksServices = [
      { service: 'customers', method: 'searchCustomers', limit: 3 },
      { service: 'invoices', method: 'searchInvoices', limit: 3 },
      { service: 'items', method: 'searchItems', limit: 3 },
      { service: 'payments', method: 'searchPayments', limit: 3 },
    ];

    return quickbooksServices.map(({ service, method, limit }) =>
      this.createSearchPromise(
        'quickbooks',
        service,
        () => (quickbooksAdapter as unknown as Record<string, (params: { query: string; limit: number }) => Promise<unknown>>)[method]({ query: searchQuery, limit }),
        requestId
      )
    );
  }

  /**
   * Create Microsoft search promises
   * Centralizes Microsoft service search logic
   */
  private createMicrosoftSearchPromises(
    microsoftAdapters: AllAdapters['microsoft'],
    searchQuery: string,
    requestId: string
  ): Promise<SearchResult>[] {
    const promises: Promise<SearchResult>[] = [];

    const microsoftServices = [
      { adapter: microsoftAdapters.outlook, service: 'outlook', method: 'searchEmails' },
      { adapter: microsoftAdapters.onedrive, service: 'onedrive', method: 'searchFiles' },
      { adapter: microsoftAdapters.calendar, service: 'calendar', method: 'searchEvents' },
      { adapter: microsoftAdapters.word, service: 'word', method: 'searchDocuments' },
      { adapter: microsoftAdapters.excel, service: 'excel', method: 'searchWorkbooks' },
    ];

    microsoftServices.forEach(({ adapter, service, method }) => {
      if (adapter) {
        promises.push(this.createSearchPromise(
          'microsoft',
          service,
          () => (adapter as unknown as Record<string, (params: { query: string; limit: number }) => Promise<unknown>>)[method]({ query: searchQuery, limit: 5 }),
          requestId
        ));
      }
    });

    return promises;
  }

  /**
   * Create Procore search promises
   * Centralizes Procore service search logic
   */
  private createProcoreSearchPromises(
    procoreAdapter: NonNullable<AllAdapters['procore']>,
    searchQuery: string,
    requestId: string
  ): Promise<SearchResult>[] {
    const procoreServices = [
      { service: 'documents', method: 'searchDocuments', limit: 5 },
      { service: 'rfis', method: 'searchRfis', limit: 5 },
    ];

    return procoreServices.map(({ service, method, limit }) =>
      this.createSearchPromise(
        'procore',
        service,
        () => (procoreAdapter as unknown as Record<string, (params: { query: string; limit: number }) => Promise<unknown>>)[method]({ query: searchQuery, limit }),
        requestId
      )
    );
  }

  /**
   * Create a search promise with basic error handling
   * Centralizes the promise creation logic following DRY principles
   */
  private createSearchPromise(
    integration: string,
    service: string,
    searchFunction: () => Promise<unknown>,
    requestId: string
  ): Promise<SearchResult> {
    return new Promise(async (resolve) => {
      const startTime = Date.now();
      
      try {
        const data = await executeWithResilience(
          searchFunction,
          integration,
          service,
          DEFAULT_TIMEOUT_CONFIG,
          DEFAULT_RETRY_CONFIG
        );

        const duration = Date.now() - startTime;
        
        // Update health status to healthy
        this.integrationHealth.set(`${integration}.${service}`, 'healthy');

        resolve({
          integration,
          service,
          success: true,
          data,
          duration,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.warn(`${integration} ${service} search failed`, {
          integration,
          service,
          error: (error as Error).message,
          duration,
          requestId,
        });

        // Update health status to unhealthy
        this.integrationHealth.set(`${integration}.${service}`, 'unhealthy');

        resolve({
          integration,
          service,
          success: false,
          data: null,
          duration,
          error: (error as Error).message,
        });
      }
    });
  }

  /**
   * Process search results and update health status
   * Centralizes result processing logic
   */
  private processSearchResults(
    results: PromiseSettledResult<SearchResult>[],
    totalDuration: number,
    requestId: string
  ): SearchResult[] {
    const processedResults: SearchResult[] = [];
    let successfulSearches = 0;
    let failedSearches = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        processedResults.push(result.value);
        if (result.value.success) {
          successfulSearches++;
        } else {
          failedSearches++;
        }
      } else {
        failedSearches++;
        logger.error('Search promise rejected', result.reason as Error, {
          requestId,
        });
      }
    }

    logger.info('Orchestrated integration searches completed', {
      totalSearches: results.length,
      successfulSearches,
      failedSearches,
      totalDuration,
      requestId,
    });

    return processedResults;
  }

  /**
   * Check if Microsoft integrations are available
   * Helper method following DRY principles
   */
  private hasMicrosoftIntegrations(microsoftAdapters: AllAdapters['microsoft']): boolean {
    return !!(
      microsoftAdapters.outlook ||
      microsoftAdapters.onedrive ||
      microsoftAdapters.calendar ||
      microsoftAdapters.word ||
      microsoftAdapters.excel
    );
  }

  /**
   * Get health status of integrations
   * Simple health monitoring for MVP
   */
  getIntegrationHealth(): Record<string, IntegrationHealth> {
    const health: Record<string, IntegrationHealth> = {};
    
    for (const [key, status] of this.integrationHealth.entries()) {
      health[key] = status;
    }
    
    return health;
  }

  /**
   * Get summary statistics for monitoring
   * Provides high-level health overview
   */
  getHealthSummary(): {
    totalIntegrations: number;
    healthyIntegrations: number;
    unhealthyIntegrations: number;
    overallHealth: IntegrationHealth;
  } {
    const health = this.getIntegrationHealth();
    const healthValues = Object.values(health);
    
    const healthyCount = healthValues.filter(h => h === 'healthy').length;
    const unhealthyCount = healthValues.filter(h => h === 'unhealthy').length;
    
    let overallHealth: IntegrationHealth = 'healthy';
    if (unhealthyCount > 0) {
      overallHealth = 'unhealthy';
    }
    
    return {
      totalIntegrations: healthValues.length,
      healthyIntegrations: healthyCount,
      unhealthyIntegrations: unhealthyCount,
      overallHealth,
    };
  }
}

// Export singleton instance following best practices
export const searchOrchestrator = new SearchOrchestrator();
