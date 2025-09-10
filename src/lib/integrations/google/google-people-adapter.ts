/**
 * Google People Integration Adapter
 * Implements the Adapter Pattern to standardize Google People API interactions
 */

import { google, people_v1 } from 'googleapis';
import { IntegrationError, toSphyrError } from '@/lib/errors';
// GooglePerson type is used from googleapis directly

export interface GooglePeopleAdapterConfig {
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

export interface GoogleContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
  photoUrl?: string;
  resourceName: string;
}

export interface GooglePeopleSearchOptions {
  query: string;
  limit?: number;
  pageToken?: string;
}

export interface GooglePeopleSearchResult {
  contacts: GoogleContact[];
  nextPageToken?: string;
  totalCount: number;
}

export class GooglePeopleAdapter {
  private people: people_v1.People;
  private config: GooglePeopleAdapterConfig;

  constructor(config: GooglePeopleAdapterConfig) {
    this.config = config;
    this.people = google.people({ version: 'v1' });
    this.initializePeopleClient();
  }

  /**
   * Initialize the Google People client with OAuth2 credentials
   */
  private initializePeopleClient(): void {
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

      this.people = google.people({ version: 'v1', auth: oauth2Client });
    } catch (error) {
      throw new IntegrationError(
        'Google People',
        'Failed to initialize Google People client',
        {
          originalError: error as Error,
          operation: 'initializePeopleClient',
        }
      );
    }
  }

  /**
   * Search for contacts in Google People
   */
  async searchContacts(options: GooglePeopleSearchOptions): Promise<GooglePeopleSearchResult> {
    try {
      const {
        query,
        limit = 10,
        pageToken
      } = options;

      // Search for contacts using the People API
      const response = await this.people.people.searchDirectoryPeople({
        query: query.trim(),
        pageSize: limit,
        pageToken,
        readMask: 'names,emailAddresses,phoneNumbers,organizations,photos',
      });

      const contacts = response.data.people || [];
      const totalCount = contacts.length;

      return {
        contacts: contacts.map((contact) => this.parseContact(contact)),
        nextPageToken: response.data.nextPageToken || undefined,
        totalCount,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google People',
        operation: 'searchContacts',
        query: options.query,
      });

      throw new IntegrationError(
        'Google People',
        `Failed to search contacts: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'searchContacts',
          query: options.query,
        }
      );
    }
  }

  /**
   * Get a specific contact by resource name
   */
  async getContact(resourceName: string): Promise<GoogleContact> {
    try {
      const response = await this.people.people.get({
        resourceName,
        personFields: 'names,emailAddresses,phoneNumbers,organizations,photos',
      });

      return this.parseContact(response.data);

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google People',
        operation: 'getContact',
        resourceName,
      });

      throw new IntegrationError(
        'Google People',
        `Failed to get contact: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getContact',
          resourceName,
        }
      );
    }
  }

  /**
   * List all contacts
   */
  async listContacts(options: { limit?: number; pageToken?: string } = {}): Promise<GooglePeopleSearchResult> {
    try {
      const { limit = 10, pageToken } = options;

      const response = await this.people.people.connections.list({
        resourceName: 'people/me',
        pageSize: limit,
        pageToken,
        personFields: 'names,emailAddresses,phoneNumbers,organizations,photos',
      });

      const contacts = response.data.connections || [];

      return {
        contacts: contacts.map((contact) => this.parseContact(contact)),
        nextPageToken: response.data.nextPageToken || undefined,
        totalCount: contacts.length,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google People',
        operation: 'listContacts',
      });

      throw new IntegrationError(
        'Google People',
        `Failed to list contacts: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'listContacts',
        }
      );
    }
  }

  /**
   * Get user's own profile information
   */
  async getProfile(): Promise<GoogleContact> {
    try {
      const response = await this.people.people.get({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,phoneNumbers,organizations,photos',
      });

      return this.parseContact(response.data);

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google People',
        operation: 'getProfile',
      });

      throw new IntegrationError(
        'Google People',
        `Failed to get profile: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getProfile',
        }
      );
    }
  }

  /**
   * Parse raw Google People contact data into our standardized format
   */
  private parseContact(person: people_v1.Schema$Person): GoogleContact {
    // Extract name
    const names = person.names || [];
    const primaryName = names.find((name) => name.metadata?.primary) || names[0];
    const displayName = primaryName ? 
      `${primaryName.givenName || ''} ${primaryName.familyName || ''}`.trim() || 
      primaryName.displayName || 'Unknown Contact' : 'Unknown Contact';

    // Extract email
    const emails = person.emailAddresses || [];
    const primaryEmail = emails.find((email) => email.metadata?.primary) || emails[0];
    const email = primaryEmail?.value;

    // Extract phone
    const phones = person.phoneNumbers || [];
    const primaryPhone = phones.find((phone) => phone.metadata?.primary) || phones[0];
    const phone = primaryPhone?.value;

    // Extract organization
    const organizations = person.organizations || [];
    const primaryOrg = organizations.find((org) => org.metadata?.primary) || organizations[0];
    const organization = primaryOrg?.name;
    const jobTitle = primaryOrg?.title;

    // Extract photo
    const photos = person.photos || [];
    const primaryPhoto = photos.find((photo) => photo.metadata?.primary) || photos[0];
    const photoUrl = primaryPhoto?.url;

    return {
      id: person.resourceName?.split('/').pop() || '',
      name: displayName,
      email: email || undefined,
      phone: phone || undefined,
      organization: organization || undefined,
      jobTitle: jobTitle || undefined,
      photoUrl: photoUrl || undefined,
      resourceName: person.resourceName || '',
    };
  }

  /**
   * Test the connection to Google People
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch {
      return false;
    }
  }
}
