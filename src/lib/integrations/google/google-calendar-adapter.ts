/**
 * Google Calendar Integration Adapter
 * Implements the Adapter Pattern to standardize Google Calendar API interactions
 */

import { google, calendar_v3 } from 'googleapis';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  GoogleCalendarEvent, 
  GoogleCalendarDateTime
} from '@/types/integrations';

export interface GoogleCalendarAdapterConfig {
  credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface GoogleCalendarSearchOptions {
  query: string;
  limit?: number;
  pageToken?: string;
  timeMin?: string;
  timeMax?: string;
  calendarId?: string;
  orderBy?: string;
}

export interface GoogleCalendarSearchResult {
  events: GoogleCalendarEvent[];
  nextPageToken?: string;
  totalCount: number;
}

export class GoogleCalendarAdapter {
  private calendar: calendar_v3.Calendar;
  private config: GoogleCalendarAdapterConfig;

  constructor(config: GoogleCalendarAdapterConfig) {
    this.config = config;
    this.calendar = google.calendar({ version: 'v3' });
    this.initializeCalendarClient();
  }

  /**
   * Initialize the Google Calendar client with OAuth2 credentials
   */
  private initializeCalendarClient(): void {
    try {
      const oauth2Client = new google.auth.OAuth2(
        this.config.credentials.clientId,
        this.config.credentials.clientSecret,
        this.config.credentials.redirectUri
      );

      oauth2Client.setCredentials({
        access_token: this.config.tokens.accessToken,
        refresh_token: this.config.tokens.refreshToken,
      });

      this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    } catch (error) {
      throw new IntegrationError(
        'Google Calendar',
        'Failed to initialize Google Calendar client',
        {
          originalError: error as Error,
          operation: 'initializeCalendarClient',
        }
      );
    }
  }

  /**
   * Search for events in Google Calendar
   */
  async searchEvents(options: GoogleCalendarSearchOptions): Promise<GoogleCalendarSearchResult> {
    try {
      const {
        query,
        limit = 10,
        pageToken,
        timeMin,
        timeMax,
        calendarId = 'primary',
        orderBy = 'startTime'
      } = options;

      // Build the search parameters
      const searchParams: Record<string, string | number | boolean> = {
        calendarId,
        maxResults: limit,
        singleEvents: true,
        orderBy,
        fields: 'nextPageToken, items(id, summary, description, start, end, attendees, location, status, created, updated)',
      };

      // Add query filter if provided
      if (query && query.trim()) {
        searchParams.q = query.trim();
      }

      // Add time filters if provided
      if (timeMin) {
        searchParams.timeMin = timeMin;
      }
      if (timeMax) {
        searchParams.timeMax = timeMax;
      }

      // Add pagination token if provided
      if (pageToken) {
        searchParams.pageToken = pageToken;
      }

      const response = await this.calendar.events.list(searchParams);

      const events = response.data.items || [];
      const totalCount = events.length; // Note: Calendar API doesn't provide total count

      return {
        events: events.map((event) => this.parseCalendarEvent(event)),
        nextPageToken: response.data.nextPageToken || undefined,
        totalCount,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Calendar',
        operation: 'searchEvents',
        query: options.query,
      });

      throw new IntegrationError(
        'Google Calendar',
        `Failed to search events: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'searchEvents',
          query: options.query,
        }
      );
    }
  }

  /**
   * Get a specific event by ID
   */
  async getEvent(eventId: string, calendarId: string = 'primary'): Promise<GoogleCalendarEvent> {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId,
        fields: 'id, summary, description, start, end, attendees, location, status, created, updated',
      });

      return this.parseCalendarEvent(response.data);

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Calendar',
        operation: 'getEvent',
        eventId,
      });

      throw new IntegrationError(
        'Google Calendar',
        `Failed to get event: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getEvent',
          eventId,
        }
      );
    }
  }

  /**
   * List upcoming events
   */
  async listUpcomingEvents(options: { limit?: number; calendarId?: string; timeMin?: string } = {}): Promise<GoogleCalendarSearchResult> {
    try {
      const { limit = 10, calendarId = 'primary', timeMin } = options;

      const searchParams: Record<string, string | number | boolean> = {
        calendarId,
        maxResults: limit,
        singleEvents: true,
        orderBy: 'startTime',
        fields: 'nextPageToken, items(id, summary, description, start, end, attendees, location, status, created, updated)',
      };

      // Use current time if no timeMin provided
      if (timeMin) {
        searchParams.timeMin = timeMin;
      } else {
        searchParams.timeMin = new Date().toISOString();
      }

      const response = await this.calendar.events.list(searchParams);

      const events = response.data.items || [];

      return {
        events: events.map((event) => this.parseCalendarEvent(event)),
        nextPageToken: response.data.nextPageToken || undefined,
        totalCount: events.length,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Calendar',
        operation: 'listUpcomingEvents',
      });

      throw new IntegrationError(
        'Google Calendar',
        `Failed to list upcoming events: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'listUpcomingEvents',
        }
      );
    }
  }

  /**
   * List all calendars for the user
   */
  async listCalendars(): Promise<Array<{ id: string; summary: string; description?: string; primary?: boolean }>> {
    try {
      const response = await this.calendar.calendarList.list({
        fields: 'items(id, summary, description, primary)',
      });

      const calendars = response.data.items || [];

      return calendars.map((calendar) => ({
        id: calendar.id || '',
        summary: calendar.summary || 'Untitled Calendar',
        description: calendar.description || undefined,
        primary: calendar.primary || false,
      }));

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Calendar',
        operation: 'listCalendars',
      });

      throw new IntegrationError(
        'Google Calendar',
        `Failed to list calendars: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'listCalendars',
        }
      );
    }
  }

  /**
   * Get user's profile information
   */
  async getProfile(): Promise<{ id: string; email: string; name: string }> {
    try {
      const response = await this.calendar.calendarList.get({
        calendarId: 'primary',
        fields: 'id, summary',
      });

      // For Calendar API, we need to get user info differently
      // This is a simplified approach - in production you might want to use the userinfo API
      return {
        id: 'primary',
        email: 'user@example.com', // This would need to be fetched from userinfo API
        name: response.data.summary || 'Primary Calendar',
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Calendar',
        operation: 'getProfile',
      });

      throw new IntegrationError(
        'Google Calendar',
        `Failed to get profile: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getProfile',
        }
      );
    }
  }

  /**
   * Parse raw Google Calendar event data into our standardized format
   */
  private parseCalendarEvent(event: calendar_v3.Schema$Event): GoogleCalendarEvent {
    return {
      id: event.id || '',
      summary: event.summary || 'No Title',
      description: event.description || undefined,
      start: this.parseDateTime(event.start),
      end: this.parseDateTime(event.end),
      attendees: (event.attendees || []).map((attendee) => ({
        email: attendee.email || '',
        displayName: attendee.displayName || undefined,
        responseStatus: attendee.responseStatus || 'needsAction',
      })),
      location: event.location || undefined,
      status: event.status || 'confirmed',
      created: event.created || new Date().toISOString(),
      updated: event.updated || new Date().toISOString(),
    };
  }

  /**
   * Parse Google Calendar date/time format
   */
  private parseDateTime(dateTime: calendar_v3.Schema$EventDateTime | undefined): GoogleCalendarDateTime {
    if (!dateTime) {
      return {
        dateTime: new Date().toISOString(),
        timeZone: 'UTC',
      };
    }

    return {
      dateTime: dateTime.dateTime || undefined,
      date: dateTime.date || undefined,
      timeZone: dateTime.timeZone || undefined,
    };
  }

  /**
   * Test the connection to Google Calendar
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listCalendars();
      return true;
    } catch {
      return false;
    }
  }
}
