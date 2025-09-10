/**
 * Microsoft OneDrive Integration Adapter
 * Implements the Adapter Pattern to standardize Microsoft Graph API interactions for OneDrive
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  OneDriveFile, 
  OneDriveSearchOptions, 
  OneDriveSearchResult,
  MicrosoftGraphFile
} from '@/types/integrations';

export interface OneDriveAdapterConfig {
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

export class OneDriveAdapter {
  private graphClient!: Client;
  private msalApp!: ConfidentialClientApplication;
  private config: OneDriveAdapterConfig;

  constructor(config: OneDriveAdapterConfig) {
    this.config = config;
    this.initializeOneDriveClient();
  }

  /**
   * Initialize the Microsoft Graph client with OAuth2 credentials
   */
  private initializeOneDriveClient(): void {
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
        'Microsoft OneDrive',
        'Failed to initialize OneDrive client',
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
        'Microsoft OneDrive',
        'Failed to refresh access token',
        {
          originalError: error as Error,
          operation: 'refreshAccessToken',
        }
      );
    }
  }

  /**
   * Search for files in OneDrive
   */
  async searchFiles(options: OneDriveSearchOptions): Promise<OneDriveSearchResult> {
    try {
      const { query, limit = 10, skip = 0, folderId = 'root' } = options;

      // Build the search query for Microsoft Graph
      const searchQuery = {
        search: query.trim(),
        orderby: 'lastModifiedDateTime desc',
        top: limit,
        skip: skip,
      };

      // Search files in OneDrive
      const response = await this.graphClient
        .api(`/me/drive/items/${folderId}/search(q='${encodeURIComponent(searchQuery.search)}')`)
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .top(searchQuery.top)
        .skip(searchQuery.skip)
        .get();

      const files = (response.value as MicrosoftGraphFile[]) || [];
      const totalCount = response['@odata.count'] || files.length;
      const hasMore = files.length === limit;

      // Parse and filter files (exclude folders if needed)
      const parsedFiles = files
        .map((file: MicrosoftGraphFile) => this.parseOneDriveFile(file))
        .filter((file: OneDriveFile) => !file.isFolder); // Only return files, not folders

      return {
        files: parsedFiles,
        totalCount,
        hasMore,
      };
    } catch (error) {
      throw this.handleOneDriveError(error, 'searchFiles', { options });
    }
  }

  /**
   * Get a specific file by ID
   */
  async getFile(fileId: string): Promise<OneDriveFile> {
    try {
      const response = await this.graphClient
        .api(`/me/drive/items/${fileId}`)
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .get();

      return this.parseOneDriveFile(response);
    } catch (error) {
      throw this.handleOneDriveError(error, 'getFile', { fileId });
    }
  }

  /**
   * Get file download URL
   */
  async getFileDownloadUrl(fileId: string): Promise<string> {
    try {
      const response = await this.graphClient
        .api(`/me/drive/items/${fileId}/content`)
        .get();

      return response['@microsoft.graph.downloadUrl'] || '';
    } catch (error) {
      throw this.handleOneDriveError(error, 'getFileDownloadUrl', { fileId });
    }
  }

  /**
   * Get user's OneDrive folders
   */
  async getFolders(): Promise<Array<{ id: string; name: string; webUrl: string; itemCount: number }>> {
    try {
      const response = await this.graphClient
        .api('/me/drive/root/children')
        .select('id,name,webUrl,folder')
        .filter('folder ne null')
        .get();

      const folders = (response.value as MicrosoftGraphFile[]) || [];
      return folders.map((folder: MicrosoftGraphFile) => ({
        id: folder.id || '',
        name: folder.name || 'Unknown Folder',
        webUrl: folder.webUrl || '',
        itemCount: folder.folder?.childCount || 0,
      }));
    } catch (error) {
      throw this.handleOneDriveError(error, 'getFolders', {});
    }
  }

  /**
   * Get user's recent files
   */
  async getRecentFiles(limit: number = 10): Promise<OneDriveFile[]> {
    try {
      const response = await this.graphClient
        .api('/me/drive/recent')
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .top(limit)
        .get();

      const files = (response.value as MicrosoftGraphFile[]) || [];
      return files.map((file: MicrosoftGraphFile) => this.parseOneDriveFile(file));
    } catch (error) {
      throw this.handleOneDriveError(error, 'getRecentFiles', { limit });
    }
  }

  /**
   * Get user's shared files
   */
  async getSharedFiles(limit: number = 10): Promise<OneDriveFile[]> {
    try {
      const response = await this.graphClient
        .api('/me/drive/sharedWithMe')
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .top(limit)
        .get();

      const files = (response.value as MicrosoftGraphFile[]) || [];
      return files.map((file: MicrosoftGraphFile) => this.parseOneDriveFile(file));
    } catch (error) {
      throw this.handleOneDriveError(error, 'getSharedFiles', { limit });
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
      throw this.handleOneDriveError(error, 'getUserInfo', {});
    }
  }

  /**
   * Parse raw OneDrive file data into our standardized format
   */
  private parseOneDriveFile(file: MicrosoftGraphFile): OneDriveFile {
    return {
      id: file.id || '',
      name: file.name || 'Unknown File',
      size: file.size || 0,
      createdDateTime: file.createdDateTime || new Date().toISOString(),
      lastModifiedDateTime: file.lastModifiedDateTime || new Date().toISOString(),
      webUrl: file.webUrl || '',
      downloadUrl: file['@microsoft.graph.downloadUrl'] || undefined,
      fileType: file.file?.mimeType ? this.getFileTypeFromMimeType(file.file.mimeType) : 'unknown',
      mimeType: file.file?.mimeType || 'application/octet-stream',
      isFolder: !!file.folder,
      parentFolderId: file.parentReference?.id || undefined,
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
    };
  }

  /**
   * Get file type from MIME type
   */
  private getFileTypeFromMimeType(mimeType: string): string {
    const mimeToType: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'application/vnd.ms-excel': 'Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
      'application/vnd.ms-powerpoint': 'PowerPoint Presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation',
      'text/plain': 'Text File',
      'text/csv': 'CSV File',
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image',
      'image/gif': 'GIF Image',
      'video/mp4': 'MP4 Video',
      'audio/mpeg': 'MP3 Audio',
      'application/zip': 'ZIP Archive',
      'application/json': 'JSON File',
    };

    return mimeToType[mimeType] || 'File';
  }

  /**
   * Handle OneDrive API errors and convert them to standardized IntegrationError
   */
  private handleOneDriveError(error: unknown, operation: string, context: Record<string, unknown>): IntegrationError {
    const sphyrError = toSphyrError(error, {
      provider: 'Microsoft OneDrive',
      operation,
      ...context,
    });

    // Handle specific Microsoft Graph errors
    if ((error as { code?: string }).code === 'InvalidAuthenticationToken') {
      return new IntegrationError(
        'Microsoft OneDrive',
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
        'Microsoft OneDrive',
        'Insufficient permissions to access OneDrive data',
        {
          originalError: error as Error,
          operation,
          context,
          userMessage: 'Insufficient permissions to access your OneDrive files. Please check your account permissions.',
        }
      );
    }

    if ((error as { code?: string }).code === 'ThrottledRequest') {
      return new IntegrationError(
        'Microsoft OneDrive',
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
      'Microsoft OneDrive',
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
