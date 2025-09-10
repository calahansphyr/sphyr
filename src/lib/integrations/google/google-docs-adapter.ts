/**
 * Google Docs Integration Adapter
 * Implements the Adapter Pattern to standardize Google Docs API interactions
 */

import { google, docs_v1, drive_v3 } from 'googleapis';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  GoogleDriveFile,
  GoogleDocsElement
} from '@/types/integrations';

export interface GoogleDocsAdapterConfig {
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

export interface GoogleDocsSearchOptions {
  query: string;
  limit?: number;
  pageToken?: string;
  orderBy?: string;
}

export interface GoogleDocsSearchResult {
  documents: GoogleDriveFile[];
  nextPageToken?: string;
  totalCount: number;
}

export class GoogleDocsAdapter {
  private docs: docs_v1.Docs;
  private drive: drive_v3.Drive;
  private config: GoogleDocsAdapterConfig;

  constructor(config: GoogleDocsAdapterConfig) {
    this.config = config;
    this.docs = google.docs({ version: 'v1' });
    this.drive = google.drive({ version: 'v3' });
    this.initializeClients();
  }

  /**
   * Initialize the Google Docs and Drive clients with OAuth2 credentials
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

      this.docs = google.docs({ version: 'v1', auth: oauth2Client });
      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
    } catch (error) {
      throw new IntegrationError(
        'Google Docs',
        'Failed to initialize Google Docs client',
        {
          originalError: error as Error,
          operation: 'initializeClients',
        }
      );
    }
  }

  /**
   * Search for Google Docs files
   */
  async searchFiles(options: GoogleDocsSearchOptions): Promise<GoogleDocsSearchResult> {
    try {
      const {
        query,
        limit = 10,
        pageToken,
        orderBy = 'modifiedTime desc'
      } = options;

      // Build the search query for Google Docs files
      let searchQuery = `name contains '${query}' or fullText contains '${query}'`;
      searchQuery += ` and mimeType='application/vnd.google-apps.document'`;
      searchQuery += ' and trashed=false';

      const response = await this.drive.files.list({
        q: searchQuery,
        pageSize: limit,
        pageToken,
        orderBy,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, owners, shared)',
      });

      const files = response.data.files || [];
      const totalCount = files.length;

      return {
        documents: files.map((file) => this.parseDriveFile(file)),
        nextPageToken: response.data.nextPageToken || undefined,
        totalCount,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Docs',
        operation: 'searchFiles',
        query: options.query,
      });

      throw new IntegrationError(
        'Google Docs',
        `Failed to search documents: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'searchFiles',
          query: options.query,
        }
      );
    }
  }

  /**
   * Get the text content of a Google Doc
   */
  async getFileContent(documentId: string): Promise<string> {
    try {
      const response = await this.docs.documents.get({
        documentId,
      });

      // Extract text content from the document structure
      const content = this.extractTextFromDocument(response.data);
      return content;

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Docs',
        operation: 'getFileContent',
        documentId,
      });

      throw new IntegrationError(
        'Google Docs',
        `Failed to get document content: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getFileContent',
          documentId,
        }
      );
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string): Promise<GoogleDriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId: documentId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, owners, shared',
      });

      return this.parseDriveFile(response.data);

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Docs',
        operation: 'getDocument',
        documentId,
      });

      throw new IntegrationError(
        'Google Docs',
        `Failed to get document: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getDocument',
          documentId,
        }
      );
    }
  }

  /**
   * List recent documents
   */
  async listRecentDocuments(options: { limit?: number } = {}): Promise<GoogleDocsSearchResult> {
    try {
      const { limit = 10 } = options;

      const response = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.document' and trashed=false",
        pageSize: limit,
        orderBy: 'modifiedTime desc',
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, owners, shared)',
      });

      const files = response.data.files || [];

      return {
        documents: files.map((file) => this.parseDriveFile(file)),
        nextPageToken: response.data.nextPageToken || undefined,
        totalCount: files.length,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Google Docs',
        operation: 'listRecentDocuments',
      });

      throw new IntegrationError(
        'Google Docs',
        `Failed to list recent documents: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'listRecentDocuments',
        }
      );
    }
  }

  /**
   * Extract text content from Google Docs document structure
   */
  private extractTextFromDocument(document: docs_v1.Schema$Document): string {
    if (!document.body || !document.body.content) {
      return '';
    }

    let text = '';
    
    const extractTextFromElement = (element: GoogleDocsElement): string => {
      if (element.textRun) {
        return element.textRun.content || '';
      }
      
      if (element.paragraph) {
        let paragraphText = '';
        if (element.paragraph.elements) {
          for (const elem of element.paragraph.elements) {
            paragraphText += extractTextFromElement(elem);
          }
        }
        return paragraphText + '\n';
      }
      
      if (element.table) {
        let tableText = '';
        if (element.table.tableRows) {
          for (const row of element.table.tableRows) {
            if (row.tableCells) {
              for (const cell of row.tableCells) {
                if (cell.content) {
                  for (const cellElement of cell.content) {
                    tableText += extractTextFromElement(cellElement);
                  }
                }
                tableText += '\t';
              }
            }
            tableText += '\n';
          }
        }
        return tableText;
      }
      
      return '';
    };

    for (const element of document.body.content) {
      text += extractTextFromElement(element as GoogleDocsElement);
    }

    return text.trim();
  }

  /**
   * Parse raw Google Drive file data into our standardized format
   */
  private parseDriveFile(file: drive_v3.Schema$File): GoogleDriveFile {
    return {
      id: file.id || '',
      name: file.name || 'Untitled Document',
      mimeType: file.mimeType || 'application/vnd.google-apps.document',
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
   * Test the connection to Google Docs
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listRecentDocuments({ limit: 1 });
      return true;
    } catch {
      return false;
    }
  }
}
