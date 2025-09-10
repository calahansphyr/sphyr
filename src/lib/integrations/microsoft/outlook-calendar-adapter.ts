/**
 * Microsoft Outlook Calendar Integration Adapter
 * Implements the Adapter Pattern to standardize Microsoft Graph API interactions for Outlook Calendar
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  OutlookCalendarEvent, 
  OutlookCalendarSearchOptions, 
  OutlookCalendarSearchResult,
  MicrosoftGraphCalendarEvent,
  MicrosoftGraphCalendar
} from '@/types/integrations';

export interface OutlookCalendarAdapterConfig {
  credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    tenantId: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class OutlookCalendarAdapter {
  private graphClient!: Client;
  private msalApp!: ConfidentialClientApplication;
  private config: OutlookCalendarAdapterConfig;

  constructor(config: OutlookCalendarAdapterConfig) {
    this.config = config;
    this.initializeCalendarClient();
  }

  /**
   * Initialize the Microsoft Graph client with OAuth2 credentials
   */
  private initializeCalendarClient(): void {
    try {
      // Initialize MSAL application
      this.msalApp = new ConfidentialClientApplication({
        auth: {
          clientId: this.config.credentials.clientId,
          clientSecret: this.config.credentials.clientSecret,
          authority: `https://login.microsoftonline.com/${this.config.credentials.tenantId}`,
        },
      });

      // Initialize Graph client with access token
      this.graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            try {
              // Try to use the existing access token first
              return this.config.tokens.accessToken;
            } catch {
              // If token is expired, try to refresh it
              const refreshResult = await this.refreshAccessToken();
              return refreshResult.accessToken;
            }
          },
        },
      });
    } catch (error) {
      throw new IntegrationError(
        'Microsoft Outlook Calendar',
        'Failed to initialize Calendar client',
        {
          originalError: error as Error,
          config: {
            clientId: this.config.credentials.clientId,
            tenantId: this.config.credentials.tenantId,
            redirectUri: this.config.credentials.redirectUri,
          },
        }
      );
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const refreshResult = await this.msalApp.acquireTokenByRefreshToken({
        refreshToken: this.config.tokens.refreshToken,
        scopes: ['https://graph.microsoft.com/Calendars.Read'],
      });

      return {
        accessToken: refreshResult?.accessToken || '',
        refreshToken: this.config.tokens.refreshToken, // Keep existing refresh token
      };
    } catch (error) {
      throw new IntegrationError(
        'Microsoft Outlook Calendar',
        'Failed to refresh access token',
        {
          originalError: error as Error,
          operation: 'refreshAccessToken',
        }
      );
    }
  }

  /**
   * Search for calendar events
   */
  async searchEvents(options: OutlookCalendarSearchOptions): Promise<OutlookCalendarSearchResult> {
    try {
      const { query, limit = 10, skip = 0, startDate, endDate, calendarId = 'primary' } = options;

      // Build the search query for Microsoft Graph
      const searchQuery = {
        search: query.trim(),
        orderby: 'start/dateTime desc',
        top: limit,
        skip: skip,
      };

      // Build the date filter if provided
      let dateFilter = '';
      if (startDate || endDate) {
        const start = startDate || new Date().toISOString();
        const end = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now
        dateFilter = `start/dateTime ge '${start}' and start/dateTime le '${end}'`;
      }

      // Search calendar events
      const response = await this.graphClient
        .api(`/me/calendars/${calendarId}/events`)
        .search(searchQuery.search)
        .orderby(searchQuery.orderby)
        .top(searchQuery.top)
        .skip(searchQuery.skip)
        .select('id,subject,start,end,location,attendees,organizer,bodyPreview,body,isAllDay,isCancelled,isOnlineMeeting,onlineMeetingProvider,onlineMeetingUrl,seriesMasterId,recurrence')
        .filter(dateFilter)
        .get();

      const events = (response.value as MicrosoftGraphCalendarEvent[]) || [];
      const totalCount = response['@odata.count'] || events.length;
      const hasMore = events.length === limit;

      // Parse events
      const parsedEvents = events.map((event: MicrosoftGraphCalendarEvent) => this.parseCalendarEvent(event));

      return {
        events: parsedEvents,
        totalCount,
        hasMore,
      };
    } catch (error) {
      throw this.handleCalendarError(error, 'searchEvents', { options });
    }
  }

  /**
   * Get a specific calendar event by ID
   */
  async getEvent(eventId: string, calendarId: string = 'primary'): Promise<OutlookCalendarEvent> {
    try {
      const response = await this.graphClient
        .api(`/me/calendars/${calendarId}/events/${eventId}`)
        .select('id,subject,start,end,location,attendees,organizer,bodyPreview,body,isAllDay,isCancelled,isOnlineMeeting,onlineMeetingProvider,onlineMeetingUrl,seriesMasterId,recurrence')
        .get();

      return this.parseCalendarEvent(response);
    } catch (error) {
      throw this.handleCalendarError(error, 'getEvent', { eventId, calendarId });
    }
  }

  /**
   * Get user's calendars
   */
  async getCalendars(): Promise<Array<{ id: string; name: string; isDefault: boolean; color: string }>> {
    try {
      const response = await this.graphClient
        .api('/me/calendars')
        .select('id,name,isDefaultCalendar,color')
        .get();

      const calendars = (response.value as MicrosoftGraphCalendar[]) || [];
      return calendars.map((calendar: MicrosoftGraphCalendar) => ({
        id: calendar.id || '',
        name: calendar.name || 'Unknown Calendar',
        isDefault: calendar.isDefaultCalendar || false,
        color: calendar.color || 'auto',
      }));
    } catch (error) {
      throw this.handleCalendarError(error, 'getCalendars', {});
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 10): Promise<OutlookCalendarEvent[]> {
    try {
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

      const response = await this.graphClient
        .api('/me/events')
        .select('id,subject,start,end,location,attendees,organizer,bodyPreview,body,isAllDay,isCancelled,isOnlineMeeting,onlineMeetingProvider,onlineMeetingUrl,seriesMasterId,recurrence')
        .filter(`start/dateTime ge '${now}' and start/dateTime le '${future}'`)
        .orderby('start/dateTime')
        .top(limit)
        .get();

      const events = (response.value as MicrosoftGraphCalendarEvent[]) || [];
      return events.map((event: MicrosoftGraphCalendarEvent) => this.parseCalendarEvent(event));
    } catch (error) {
      throw this.handleCalendarError(error, 'getUpcomingEvents', { limit });
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(): Promise<{ id: string; name: string; email: string }> {
    try {
      const response = await this.graphClient
        .api('/me')
        .select('id,displayName,mail')
        .get();

      return {
        id: response.id || '',
        name: response.displayName || 'Unknown User',
        email: response.mail || response.userPrincipalName || '',
      };
    } catch (error) {
      throw this.handleCalendarError(error, 'getUserInfo', {});
    }
  }

  /**
   * Parse raw calendar event data into our standardized format
   */
  private parseCalendarEvent(event: MicrosoftGraphCalendarEvent): OutlookCalendarEvent {
    return {
      id: event.id || '',
      subject: event.subject || 'No Subject',
      start: {
        dateTime: event.start?.dateTime || new Date().toISOString(),
        timeZone: event.start?.timeZone || 'UTC',
      },
      end: {
        dateTime: event.end?.dateTime || new Date().toISOString(),
        timeZone: event.end?.timeZone || 'UTC',
      },
      location: event.location ? {
        displayName: event.location.displayName || '',
        address: event.location.address ? {
          street: event.location.address.street || undefined,
          city: event.location.address.city || undefined,
          state: event.location.address.state || undefined,
          countryOrRegion: event.location.address.countryOrRegion || undefined,
          postalCode: event.location.address.postalCode || undefined,
        } : undefined,
      } : undefined,
      attendees: (event.attendees || []).map((attendee) => ({
        emailAddress: {
          name: attendee.emailAddress?.name || 'Unknown',
          address: attendee.emailAddress?.address || '',
        },
        type: attendee.type || 'required',
        status: {
          response: attendee.status?.response || 'none',
          time: attendee.status?.time || new Date().toISOString(),
        },
      })),
      organizer: {
        emailAddress: {
          name: event.organizer?.emailAddress?.name || 'Unknown',
          address: event.organizer?.emailAddress?.address || '',
        },
      },
      bodyPreview: event.bodyPreview || '',
      body: event.body?.content || '',
      isAllDay: event.isAllDay || false,
      isCancelled: event.isCancelled || false,
      isOnlineMeeting: event.isOnlineMeeting || false,
      onlineMeetingProvider: event.onlineMeetingProvider || undefined,
      onlineMeetingUrl: event.onlineMeetingUrl || undefined,
      seriesMasterId: event.seriesMasterId || undefined,
      recurrence: event.recurrence ? {
        pattern: {
          type: event.recurrence.pattern?.type || 'daily',
          interval: event.recurrence.pattern?.interval || 1,
          daysOfWeek: event.recurrence.pattern?.daysOfWeek || undefined,
          dayOfMonth: event.recurrence.pattern?.dayOfMonth || undefined,
          month: event.recurrence.pattern?.month || undefined,
        },
        range: {
          type: event.recurrence.range?.type || 'noEnd',
          startDate: event.recurrence.range?.startDate || new Date().toISOString(),
          endDate: event.recurrence.range?.endDate || undefined,
          numberOfOccurrences: event.recurrence.range?.numberOfOccurrences || undefined,
        },
      } : undefined,
    };
  }

  /**
   * Handle calendar API errors and convert them to standardized IntegrationError
   */
  private handleCalendarError(error: unknown, operation: string, context: Record<string, unknown>): IntegrationError {
    const sphyrError = toSphyrError(error, {
      provider: 'Microsoft Outlook Calendar',
      operation,
      ...context,
    });

    // Handle specific Microsoft Graph errors
    if ((error as { code?: string }).code === 'InvalidAuthenticationToken') {
      return new IntegrationError(
        'Microsoft Outlook Calendar',
        'Authentication token is invalid or expired. Please reconnect your Microsoft account.',
        {
          originalError: error as Error,
          operation,
          context,
          userMessage: 'Your Microsoft account session has expired. Please reconnect your account.',
        }
      );
    }

    if ((error as { code?: string }).code === 'Forbidden') {
      return new IntegrationError(
        'Microsoft Outlook Calendar',
        'Insufficient permissions to access calendar data',
        {
          originalError: error as Error,
          operation,
          context,
          userMessage: 'Insufficient permissions to access your calendar. Please check your account permissions.',
        }
      );
    }

    if ((error as { code?: string }).code === 'ThrottledRequest') {
      return new IntegrationError(
        'Microsoft Outlook Calendar',
        'Request was throttled by Microsoft Graph API',
        {
          originalError: error as Error,
          operation,
          context,
          userMessage: 'Request was rate limited. Please try again in a moment.',
        }
      );
    }

    return new IntegrationError(
      'Microsoft Outlook Calendar',
      `Failed to ${operation}: ${sphyrError.message}`,
      {
        originalError: error as Error,
        operation,
        context,
      }
    );
  }

  /**
   * Test the connection to Microsoft Graph
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getUserInfo();
      return true;
    } catch {
      return false;
    }
  }
}
