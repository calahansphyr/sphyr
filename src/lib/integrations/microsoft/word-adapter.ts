/**
 * Microsoft Word Integration Adapter
 * Implements the Adapter Pattern to standardize Microsoft Graph API interactions for Word documents
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  WordDocument, 
  WordSearchOptions, 
  WordSearchResult,
  MicrosoftGraphFile
} from '@/types/integrations';

export interface WordAdapterConfig {
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

export class WordAdapter {
  private graphClient!: Client;
  private msalApp!: ConfidentialClientApplication;
  private config: WordAdapterConfig;

  constructor(config: WordAdapterConfig) {
    this.config = config;
    this.initializeWordClient();
  }

  /**
   * Initialize the Microsoft Graph client with OAuth2 credentials
   */
  private initializeWordClient(): void {
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
        'Microsoft Word',
        'Failed to initialize Word client',
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
        scopes: ['https://graph.microsoft.com/Files.Read.All'],
      });

      return {
        accessToken: refreshResult?.accessToken || '',
        refreshToken: this.config.tokens.refreshToken, // Keep existing refresh token
      };
    } catch (error) {
      throw new IntegrationError(
        'Microsoft Word',
        'Failed to refresh access token',
        {
          originalError: error as Error,
          operation: 'refreshAccessToken',
        }
      );
    }
  }

  /**
   * Search for Word documents
   */
  async searchDocuments(options: WordSearchOptions): Promise<WordSearchResult> {
    try {
      const { query, limit = 10, skip = 0, folderId = 'root' } = options;

      // Build the search query for Microsoft Graph
      const searchQuery = {
        search: query.trim(),
        orderby: 'lastModifiedDateTime desc',
        top: limit,
        skip: skip,
      };

      // Search for Word documents in OneDrive
      const response = await this.graphClient
        .api(`/me/drive/items/${folderId}/search(q='${encodeURIComponent(searchQuery.search)}')`)
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .top(searchQuery.top)
        .skip(searchQuery.skip)
        .get();

      const files = (response.value as MicrosoftGraphFile[]) || [];
      const totalCount = response['@odata.count'] || files.length;
      const hasMore = files.length === limit;

      // Filter for Word documents only
      const wordDocuments = files
        .filter((file: MicrosoftGraphFile) => {
          const mimeType = file.file?.mimeType || '';
          return mimeType.includes('wordprocessingml') || 
                 mimeType.includes('msword') ||
                 file.name.toLowerCase().endsWith('.docx') ||
                 file.name.toLowerCase().endsWith('.doc');
        })
        .map((file: MicrosoftGraphFile) => this.parseWordDocument(file));

      return {
        documents: wordDocuments,
        totalCount,
        hasMore,
      };
    } catch (error) {
      throw this.handleWordError(error, 'searchDocuments', { options });
    }
  }

  /**
   * Get a specific Word document by ID
   */
  async getDocument(documentId: string): Promise<WordDocument> {
    try {
      const response = await this.graphClient
        .api(`/me/drive/items/${documentId}`)
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .get();

      return this.parseWordDocument(response);
    } catch (error) {
      throw this.handleWordError(error, 'getDocument', { documentId });
    }
  }

  /**
   * Get document content (if accessible)
   */
  async getDocumentContent(documentId: string): Promise<string> {
    try {
      // Try to get document content using the Graph API
      const response = await this.graphClient
        .api(`/me/drive/items/${documentId}/content`)
        .get();

      // This might return binary content, so we'll need to handle it appropriately
      return typeof response === 'string' ? response : 'Content not accessible';
    } catch {
      // If we can't get content, return empty string
      return '';
    }
  }

  /**
   * Get recent Word documents
   */
  async getRecentDocuments(limit: number = 10): Promise<WordDocument[]> {
    try {
      const response = await this.graphClient
        .api('/me/drive/recent')
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .top(limit)
        .get();

      const files = (response.value as MicrosoftGraphFile[]) || [];
      const wordDocuments = files
        .filter((file: MicrosoftGraphFile) => {
          const mimeType = file.file?.mimeType || '';
          return mimeType.includes('wordprocessingml') || 
                 mimeType.includes('msword') ||
                 file.name.toLowerCase().endsWith('.docx') ||
                 file.name.toLowerCase().endsWith('.doc');
        })
        .map((file: MicrosoftGraphFile) => this.parseWordDocument(file));

      return wordDocuments;
    } catch (error) {
      throw this.handleWordError(error, 'getRecentDocuments', { limit });
    }
  }

  /**
   * Get shared Word documents
   */
  async getSharedDocuments(limit: number = 10): Promise<WordDocument[]> {
    try {
      const response = await this.graphClient
        .api('/me/drive/sharedWithMe')
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .top(limit)
        .get();

      const files = (response.value as MicrosoftGraphFile[]) || [];
      const wordDocuments = files
        .filter((file: MicrosoftGraphFile) => {
          const mimeType = file.file?.mimeType || '';
          return mimeType.includes('wordprocessingml') || 
                 mimeType.includes('msword') ||
                 file.name.toLowerCase().endsWith('.docx') ||
                 file.name.toLowerCase().endsWith('.doc');
        })
        .map((file: MicrosoftGraphFile) => this.parseWordDocument(file));

      return wordDocuments;
    } catch (error) {
      throw this.handleWordError(error, 'getSharedDocuments', { limit });
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
      throw this.handleWordError(error, 'getUserInfo', {});
    }
  }

  /**
   * Parse raw Word document data into our standardized format
   */
  private parseWordDocument(file: MicrosoftGraphFile): WordDocument {
    return {
      id: file.id || '',
      name: file.name || 'Unknown Document',
      size: file.size || 0,
      createdDateTime: file.createdDateTime || new Date().toISOString(),
      lastModifiedDateTime: file.lastModifiedDateTime || new Date().toISOString(),
      webUrl: file.webUrl || '',
      downloadUrl: file['@microsoft.graph.downloadUrl'] || undefined,
      createdBy: {
        user: {
          displayName: file.createdBy?.user?.displayName || 'Unknown User',
          email: file.createdBy?.user?.email || '',
        },
      },
      lastModifiedBy: {
        user: {
          displayName: file.lastModifiedBy?.user?.displayName || 'Unknown User',
          email: file.lastModifiedBy?.user?.email || '',
        },
      },
      shared: file.shared ? {
        scope: file.shared.scope || 'users',
        sharedBy: {
          user: {
            displayName: file.shared.sharedBy?.user?.displayName || 'Unknown User',
            email: file.shared.sharedBy?.user?.email || '',
          },
        },
        sharedDateTime: file.shared.sharedDateTime || new Date().toISOString(),
      } : undefined,
      content: undefined, // Will be populated if needed
      wordCount: undefined, // Will be populated if accessible
      pageCount: undefined, // Will be populated if accessible
    };
  }

  /**
   * Handle Word API errors and convert them to standardized IntegrationError
   */
  private handleWordError(error: unknown, operation: string, context: Record<string, unknown>): IntegrationError {
    const sphyrError = toSphyrError(error, {
      provider: 'Microsoft Word',
      operation,
      ...context,
    });

    // Handle specific Microsoft Graph errors
    if ((error as { code?: string }).code === 'InvalidAuthenticationToken') {
      return new IntegrationError(
        'Microsoft Word',
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
        'Microsoft Word',
        'Insufficient permissions to access Word documents',
        {
          originalError: error as Error,
          operation,
          context,
          userMessage: 'Insufficient permissions to access your Word documents. Please check your account permissions.',
        }
      );
    }

    if ((error as { code?: string }).code === 'ThrottledRequest') {
      return new IntegrationError(
        'Microsoft Word',
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
      'Microsoft Word',
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
