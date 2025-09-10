/**
 * Product Analytics Service
 * Tracks business events and user behavior for data-driven decision making
 */

import { createServiceClient } from './supabase/server';
import { logger } from './logger';

export interface AnalyticsEvent {
  type: 'user_signed_up' | 'integration_connected' | 'search_performed' | 'feature_used' | 'error_occurred';
  userId: string;
  organizationId: string;
  properties?: Record<string, string | number | boolean | null>;
}

export interface AnalyticsSummary {
  eventType: string;
  eventCount: number;
  uniqueUsers: number;
}

/**
 * Product Analytics Service
 * Centralized service for tracking business events and user behavior
 */
export class ProductAnalyticsService {
  private static instance: ProductAnalyticsService;
  private isEnabled: boolean;

  private constructor() {
    // Enable analytics in production and development
    this.isEnabled = process.env.NODE_ENV !== 'test';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProductAnalyticsService {
    if (!ProductAnalyticsService.instance) {
      ProductAnalyticsService.instance = new ProductAnalyticsService();
    }
    return ProductAnalyticsService.instance;
  }

  /**
   * Track a business event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled) {
      logger.debug('Analytics disabled, skipping event tracking', { eventType: event.type });
      return;
    }

    try {
      const supabase = createServiceClient();
      
      const { error } = await supabase
        .from('product_analytics_events')
        .insert({
          event_type: event.type,
          user_id: event.userId,
          organization_id: event.organizationId,
          properties: event.properties || {},
        });

      if (error) {
        logger.error('Failed to track analytics event', error as Error, {
          eventType: event.type,
          userId: event.userId,
          organizationId: event.organizationId,
        });
        return;
      }

      logger.info('Analytics event tracked', {
        eventType: event.type,
        userId: event.userId,
        organizationId: event.organizationId,
        properties: event.properties,
      });
    } catch (error) {
      logger.error('Analytics tracking failed', error as Error, {
        eventType: event.type,
        userId: event.userId,
        organizationId: event.organizationId,
      });
    }
  }

  /**
   * Track user signup event
   */
  async trackUserSignup(userId: string, organizationId: string, properties?: Record<string, string | number | boolean | null>): Promise<void> {
    await this.trackEvent({
      type: 'user_signed_up',
      userId,
      organizationId,
      properties: {
        signup_method: 'email',
        ...properties,
      },
    });
  }

  /**
   * Track integration connection event
   */
  async trackIntegrationConnected(
    userId: string,
    organizationId: string,
    integrationType: string,
    integrationName: string,
    properties?: Record<string, string | number | boolean | null>
  ): Promise<void> {
    await this.trackEvent({
      type: 'integration_connected',
      userId,
      organizationId,
      properties: {
        integration_type: integrationType,
        integration_name: integrationName,
        ...properties,
      },
    });
  }

  /**
   * Track search performed event
   */
  async trackSearchPerformed(
    userId: string,
    organizationId: string,
    query: string,
    resultCount: number,
    properties?: Record<string, string | number | boolean | null>
  ): Promise<void> {
    await this.trackEvent({
      type: 'search_performed',
      userId,
      organizationId,
      properties: {
        query_length: query.length,
        result_count: resultCount,
        has_results: resultCount > 0,
        ...properties,
      },
    });
  }

  /**
   * Track feature usage event
   */
  async trackFeatureUsed(
    userId: string,
    organizationId: string,
    featureName: string,
    properties?: Record<string, string | number | boolean | null>
  ): Promise<void> {
    await this.trackEvent({
      type: 'feature_used',
      userId,
      organizationId,
      properties: {
        feature_name: featureName,
        ...properties,
      },
    });
  }

  /**
   * Track error occurrence event
   */
  async trackErrorOccurred(
    userId: string,
    organizationId: string,
    errorType: string,
    errorMessage: string,
    properties?: Record<string, string | number | boolean | null>
  ): Promise<void> {
    await this.trackEvent({
      type: 'error_occurred',
      userId,
      organizationId,
      properties: {
        error_type: errorType,
        error_message: errorMessage,
        ...properties,
      },
    });
  }

  /**
   * Get analytics summary for an organization
   */
  async getAnalyticsSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsSummary[]> {
    try {
      const supabase = createServiceClient();
      
      const { data, error } = await supabase.rpc('get_analytics_summary', {
        org_id: organizationId,
        start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: endDate?.toISOString() || new Date().toISOString(),
      });

      if (error) {
        logger.error('Failed to get analytics summary', error as Error, {
          organizationId,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Analytics summary retrieval failed', error as Error, {
        organizationId,
      });
      return [];
    }
  }

  /**
   * Get event counts by type for an organization
   */
  async getEventCounts(
    organizationId: string,
    eventTypes?: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, number>> {
    try {
      const supabase = createServiceClient();
      
      let query = supabase
        .from('product_analytics_events')
        .select('event_type')
        .eq('organization_id', organizationId);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }
      if (eventTypes && eventTypes.length > 0) {
        query = query.in('event_type', eventTypes);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to get event counts', error as Error, {
          organizationId,
        });
        return {};
      }

      // Count events by type
      const counts: Record<string, number> = {};
      data?.forEach((event) => {
        counts[event.event_type] = (counts[event.event_type] || 0) + 1;
      });

      return counts;
    } catch (error) {
      logger.error('Event counts retrieval failed', error as Error, {
        organizationId,
      });
      return {};
    }
  }
}

// Export singleton instance
export const productAnalytics = ProductAnalyticsService.getInstance();
