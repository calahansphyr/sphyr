/**
 * Google Drive Integration Adapter
 * Implements the Adapter Pattern to standardize Google Drive API interactions
 */

import { google, drive_v3 } from 'googleapis';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { GoogleDriveFile } from '@/types/integrations';

export interface GoogleDriveAdapterConfig {
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

export interface GoogleDriveSearchOptions {
  query: string;
  limit?: number;
  pageToken?: string;
  mimeType?: string;
  orderBy?: string;
}

export interface GoogleDriveSearchResult {
  files: GoogleDriveFile[];
  nextPageToken?: string;
  totalCount: number;
}

export class GoogleDriveAdapter {
  private drive: drive_v3.Drive;
  private config: GoogleDriveAdapterConfig;

  constructor(config: GoogleDriveAdapterConfig) {
    this.config = config;
    this.drive = google.drive({ version: 'v3' });
    this.initializeDriveClient();
  }

  /**
   * Initialize the Google Drive client with OAuth2 credentials
   */
  private initializeDriveClient(): void {
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

      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
    } catch (error) {
      throw new IntegrationError(
        'Google Drive',
        'Failed to initialize Google Drive client',
        {
          originalError: error as Error,
          operation: 'initializeDriveClient',
        }
      );
    }
  }

  /**
   * Search for files in Google Drive
   */
  async searchFiles(options: GoogleDriveSearchOptions): Promise<GoogleDriveSearchResult> {
    try {
      const {
        query,
        limit = 10,
        pageToken,
        mimeType,
        orderBy = 'modifiedTime desc'
      } = options;

      // Build the search query
      let searchQuery = `name contains '${query}' or fullText contains '${query}'`;
      
      // Add MIME type filter if specified
      if (mimeType) {
        searchQuery += ` and mimeType='${mimeType}'`;
      }

      // Add trashed=false to exclude deleted files
      searchQuery += ' and trashed=false';

      const response = await this.drive.files.list({
        q: searchQuery,
        pageSize: limit,
        pageToken,
        orderBy,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, owners, shared)',
      });

      const files = (response.data.files || []).filter((file) => file.id); // Filter out files without IDs
      const totalCount = files.length; // Note: Drive API doesn't provide total count

      return {
        files: files.map((file) => this.parseDriveFile(file)),
        nextPageToken: response.data.nextPageToken || undefined,
        totalCount,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Drive',
        operation: 'searchFiles',
        query: options.query,
      });

      throw new IntegrationError(
        'Google Drive',
        `Failed to search files: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'searchFiles',
          query: options.query,
        }
      );
    }
  }

  /**
   * Get a specific file by ID
   */
  async getFile(fileId: string): Promise<GoogleDriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, owners, shared',
      });

      return this.parseDriveFile(response.data);

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Drive',
        operation: 'getFile',
        fileId,
      });

      throw new IntegrationError(
        'Google Drive',
        `Failed to get file: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getFile',
          fileId,
        }
      );
    }
  }

  /**
   * Get file content as text (for text-based files)
   */
  async getFileContent(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
      }, {
        responseType: 'text',
      });

      return response.data as string;

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Drive',
        operation: 'getFileContent',
        fileId,
      });

      throw new IntegrationError(
        'Google Drive',
        `Failed to get file content: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getFileContent',
          fileId,
        }
      );
    }
  }

  /**
   * List files in a specific folder
   */
  async listFilesInFolder(folderId: string, options: { limit?: number; pageToken?: string } = {}): Promise<GoogleDriveSearchResult> {
    try {
      const { limit = 10, pageToken } = options;

      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: limit,
        pageToken,
        orderBy: 'modifiedTime desc',
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, owners, shared)',
      });

      const files = (response.data.files || []).filter((file) => file.id); // Filter out files without IDs

      return {
        files: files.map((file) => this.parseDriveFile(file)),
        nextPageToken: response.data.nextPageToken || undefined,
        totalCount: files.length,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Drive',
        operation: 'listFilesInFolder',
        folderId,
      });

      throw new IntegrationError(
        'Google Drive',
        `Failed to list files in folder: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'listFilesInFolder',
          folderId,
        }
      );
    }
  }

  /**
   * Get user's profile information
   */
  async getProfile(): Promise<{ id: string; email: string; name: string }> {
    try {
      const response = await this.drive.about.get({
        fields: 'user(displayName, emailAddress, photoLink)',
      });

      const user = response.data.user;
      return {
        id: user?.emailAddress || '',
        email: user?.emailAddress || '',
        name: user?.displayName || 'Unknown User',
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Drive',
        operation: 'getProfile',
      });

      throw new IntegrationError(
        'Google Drive',
        `Failed to get profile: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getProfile',
        }
      );
    }
  }

  /**
   * Parse raw Google Drive file data into our standardized format
   */
  private parseDriveFile(file: drive_v3.Schema$File): GoogleDriveFile {
    return {
      id: file.id || '',
      name: file.name || 'Untitled',
      mimeType: file.mimeType || 'application/octet-stream',
      size: file.size ? parseInt(file.size) : undefined,
      createdTime: file.createdTime || new Date().toISOString(),
      modifiedTime: file.modifiedTime || new Date().toISOString(),
      webViewLink: file.webViewLink || undefined,
      webContentLink: file.webContentLink || undefined,
      parents: file.parents || undefined,
      owners: (file.owners || []).map((owner) => ({
        displayName: owner.displayName || 'Unknown',
        emailAddress: owner.emailAddress || '',
        photoLink: owner.photoLink || undefined,
      })),
      shared: file.shared || false,
    };
  }

  /**
   * Test the connection to Google Drive
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
