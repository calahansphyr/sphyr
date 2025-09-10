/**
 * Google Sheets Integration Adapter
 * Implements the Adapter Pattern to standardize Google Sheets API interactions
 */

import { google, sheets_v4, drive_v3 } from 'googleapis';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  GoogleDriveFile
} from '@/types/integrations';

export interface GoogleSheetsAdapterConfig {
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

export interface GoogleSheetsSearchOptions {
  query: string;
  limit?: number;
  pageToken?: string;
  orderBy?: string;
}

export interface GoogleSheetsSearchResult {
  spreadsheets: GoogleDriveFile[];
  nextPageToken?: string;
  totalCount: number;
}

export class GoogleSheetsAdapter {
  private sheets: sheets_v4.Sheets;
  private drive: drive_v3.Drive;
  private config: GoogleSheetsAdapterConfig;

  constructor(config: GoogleSheetsAdapterConfig) {
    this.config = config;
    this.sheets = google.sheets({ version: 'v4' });
    this.drive = google.drive({ version: 'v3' });
    this.initializeClients();
  }

  /**
   * Initialize the Google Sheets and Drive clients with OAuth2 credentials
   */
  private initializeClients(): void {
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

      this.sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
    } catch (error) {
      throw new IntegrationError(
        'Google Sheets',
        'Failed to initialize Google Sheets client',
        {
          originalError: error as Error,
          operation: 'initializeClients',
        }
      );
    }
  }

  /**
   * Search for Google Sheets files
   */
  async searchFiles(options: GoogleSheetsSearchOptions): Promise<GoogleSheetsSearchResult> {
    try {
      const {
        query,
        limit = 10,
        pageToken,
        orderBy = 'modifiedTime desc'
      } = options;

      // Build the search query for Google Sheets files
      let searchQuery = `name contains '${query}' or fullText contains '${query}'`;
      searchQuery += ` and mimeType='application/vnd.google-apps.spreadsheet'`;
      searchQuery += ' and trashed=false';

      const response = await this.drive.files.list({
        q: searchQuery,
        pageSize: limit,
        pageToken,
        orderBy,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, owners, shared)',
      });

      const files = (response.data.files || []).filter((file) => file.id); // Filter out files without IDs
      const totalCount = files.length;

      return {
        spreadsheets: files.map((file) => this.parseDriveFile(file)),
        nextPageToken: response.data.nextPageToken || undefined,
        totalCount,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Sheets',
        operation: 'searchFiles',
        query: options.query,
      });

      throw new IntegrationError(
        'Google Sheets',
        `Failed to search spreadsheets: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'searchFiles',
          query: options.query,
        }
      );
    }
  }

  /**
   * Get the text content of a Google Sheet
   */
  async getFileContent(spreadsheetId: string, range?: string): Promise<string> {
    try {
      // If no range specified, get all sheets
      const targetRange = range || 'A:Z';
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: targetRange,
      });

      // Convert the 2D array to readable text
      const content = this.convertSheetDataToText(response.data.values || []);
      return content;

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Sheets',
        operation: 'getFileContent',
        spreadsheetId,
      });

      throw new IntegrationError(
        'Google Sheets',
        `Failed to get spreadsheet content: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getFileContent',
          spreadsheetId,
        }
      );
    }
  }

  /**
   * Get a specific spreadsheet by ID
   */
  async getSpreadsheet(spreadsheetId: string): Promise<GoogleDriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId: spreadsheetId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, owners, shared',
      });

      return this.parseDriveFile(response.data);

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Sheets',
        operation: 'getSpreadsheet',
        spreadsheetId,
      });

      throw new IntegrationError(
        'Google Sheets',
        `Failed to get spreadsheet: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getSpreadsheet',
          spreadsheetId,
        }
      );
    }
  }

  /**
   * Get spreadsheet metadata including sheet names
   */
  async getSpreadsheetMetadata(spreadsheetId: string): Promise<{ title: string; sheets: Array<{ title: string; sheetId: number }> }> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'properties.title,sheets.properties',
      });

      const sheets = (response.data.sheets || []).map((sheet) => ({
        title: sheet.properties?.title || 'Untitled Sheet',
        sheetId: sheet.properties?.sheetId || 0,
      }));

      return {
        title: response.data.properties?.title || 'Untitled Spreadsheet',
        sheets,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Sheets',
        operation: 'getSpreadsheetMetadata',
        spreadsheetId,
      });

      throw new IntegrationError(
        'Google Sheets',
        `Failed to get spreadsheet metadata: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getSpreadsheetMetadata',
          spreadsheetId,
        }
      );
    }
  }

  /**
   * List recent spreadsheets
   */
  async listRecentSpreadsheets(options: { limit?: number } = {}): Promise<GoogleSheetsSearchResult> {
    try {
      const { limit = 10 } = options;

      const response = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
        pageSize: limit,
        orderBy: 'modifiedTime desc',
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, owners, shared)',
      });

      const files = (response.data.files || []).filter((file) => file.id); // Filter out files without IDs

      return {
        spreadsheets: files.map((file) => this.parseDriveFile(file)),
        nextPageToken: response.data.nextPageToken || undefined,
        totalCount: files.length,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Sheets',
        operation: 'listRecentSpreadsheets',
      });

      throw new IntegrationError(
        'Google Sheets',
        `Failed to list recent spreadsheets: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'listRecentSpreadsheets',
        }
      );
    }
  }

  /**
   * Convert 2D sheet data array to readable text
   */
  private convertSheetDataToText(values: string[][]): string {
    if (!values || values.length === 0) {
      return '';
    }

    let text = '';
    
    for (const row of values) {
      if (row && row.length > 0) {
        // Join cells with tabs and add newline
        text += row.join('\t') + '\n';
      }
    }

    return text.trim();
  }

  /**
   * Parse raw Google Drive file data into our standardized format
   */
  private parseDriveFile(file: drive_v3.Schema$File): GoogleDriveFile {
    return {
      id: file.id || '',
      name: file.name || 'Untitled Spreadsheet',
      mimeType: file.mimeType || 'application/vnd.google-apps.spreadsheet',
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
   * Test the connection to Google Sheets
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listRecentSpreadsheets({ limit: 1 });
      return true;
    } catch {
      return false;
    }
  }
}
