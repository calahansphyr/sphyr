/**
 * Microsoft Excel Integration Adapter
 * Implements the Adapter Pattern to standardize Microsoft Graph API interactions for Excel workbooks
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  ExcelWorkbook, 
  ExcelSearchOptions, 
  ExcelSearchResult,
  MicrosoftGraphFile,
  MicrosoftGraphWorksheet
} from '@/types/integrations';

export interface ExcelAdapterConfig {
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

export class ExcelAdapter {
  private graphClient!: Client;
  private msalApp!: ConfidentialClientApplication;
  private config: ExcelAdapterConfig;

  constructor(config: ExcelAdapterConfig) {
    this.config = config;
    this.initializeExcelClient();
  }

  /**
   * Initialize the Microsoft Graph client with OAuth2 credentials
   */
  private initializeExcelClient(): void {
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
        'Microsoft Excel',
        'Failed to initialize Excel client',
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
        'Microsoft Excel',
        'Failed to refresh access token',
        {
          originalError: error as Error,
          operation: 'refreshAccessToken',
        }
      );
    }
  }

  /**
   * Search for Excel workbooks
   */
  async searchWorkbooks(options: ExcelSearchOptions): Promise<ExcelSearchResult> {
    try {
      const { query, limit = 10, skip = 0, folderId = 'root' } = options;

      // Build the search query for Microsoft Graph
      const searchQuery = {
        search: query.trim(),
        orderby: 'lastModifiedDateTime desc',
        top: limit,
        skip: skip,
      };

      // Search for Excel workbooks in OneDrive
      const response = await this.graphClient
        .api(`/me/drive/items/${folderId}/search(q='${encodeURIComponent(searchQuery.search)}')`)
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .top(searchQuery.top)
        .skip(searchQuery.skip)
        .get();

      const files = (response.value as MicrosoftGraphFile[]) || [];
      const totalCount = response['@odata.count'] || files.length;
      const hasMore = files.length === limit;

      // Filter for Excel workbooks only
      const excelWorkbooks = files
        .filter((file: MicrosoftGraphFile) => {
          const mimeType = file.file?.mimeType || '';
          return mimeType.includes('spreadsheetml') || 
                 mimeType.includes('ms-excel') ||
                 file.name.toLowerCase().endsWith('.xlsx') ||
                 file.name.toLowerCase().endsWith('.xls');
        })
        .map((file: MicrosoftGraphFile) => this.parseExcelWorkbook(file));

      return {
        workbooks: excelWorkbooks,
        totalCount,
        hasMore,
      };
    } catch (error) {
      throw this.handleExcelError(error, 'searchWorkbooks', { options });
    }
  }

  /**
   * Get a specific Excel workbook by ID
   */
  async getWorkbook(workbookId: string): Promise<ExcelWorkbook> {
    try {
      const response = await this.graphClient
        .api(`/me/drive/items/${workbookId}`)
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .get();

      return this.parseExcelWorkbook(response);
    } catch (error) {
      throw this.handleExcelError(error, 'getWorkbook', { workbookId });
    }
  }

  /**
   * Get workbook worksheets
   */
  async getWorkbookWorksheets(workbookId: string): Promise<Array<{ id: string; name: string; position: number; visibility: string }>> {
    try {
      const response = await this.graphClient
        .api(`/me/drive/items/${workbookId}/workbook/worksheets`)
        .select('id,name,position,visibility')
        .get();

      const worksheets = (response.value as MicrosoftGraphWorksheet[]) || [];
      return worksheets.map((worksheet: MicrosoftGraphWorksheet) => ({
        id: worksheet.id || '',
        name: worksheet.name || 'Unknown Sheet',
        position: worksheet.position || 0,
        visibility: worksheet.visibility || 'visible',
      }));
    } catch (error) {
      throw this.handleExcelError(error, 'getWorkbookWorksheets', { workbookId });
    }
  }

  /**
   * Get recent Excel workbooks
   */
  async getRecentWorkbooks(limit: number = 10): Promise<ExcelWorkbook[]> {
    try {
      const response = await this.graphClient
        .api('/me/drive/recent')
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .top(limit)
        .get();

      const files = (response.value as MicrosoftGraphFile[]) || [];
      const excelWorkbooks = files
        .filter((file: MicrosoftGraphFile) => {
          const mimeType = file.file?.mimeType || '';
          return mimeType.includes('spreadsheetml') || 
                 mimeType.includes('ms-excel') ||
                 file.name.toLowerCase().endsWith('.xlsx') ||
                 file.name.toLowerCase().endsWith('.xls');
        })
        .map((file: MicrosoftGraphFile) => this.parseExcelWorkbook(file));

      return excelWorkbooks;
    } catch (error) {
      throw this.handleExcelError(error, 'getRecentWorkbooks', { limit });
    }
  }

  /**
   * Get shared Excel workbooks
   */
  async getSharedWorkbooks(limit: number = 10): Promise<ExcelWorkbook[]> {
    try {
      const response = await this.graphClient
        .api('/me/drive/sharedWithMe')
        .select('id,name,size,createdDateTime,lastModifiedDateTime,webUrl,file,parentReference,createdBy,lastModifiedBy,shared')
        .top(limit)
        .get();

      const files = (response.value as MicrosoftGraphFile[]) || [];
      const excelWorkbooks = files
        .filter((file: MicrosoftGraphFile) => {
          const mimeType = file.file?.mimeType || '';
          return mimeType.includes('spreadsheetml') || 
                 mimeType.includes('ms-excel') ||
                 file.name.toLowerCase().endsWith('.xlsx') ||
                 file.name.toLowerCase().endsWith('.xls');
        })
        .map((file: MicrosoftGraphFile) => this.parseExcelWorkbook(file));

      return excelWorkbooks;
    } catch (error) {
      throw this.handleExcelError(error, 'getSharedWorkbooks', { limit });
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
      throw this.handleExcelError(error, 'getUserInfo', {});
    }
  }

  /**
   * Parse raw Excel workbook data into our standardized format
   */
  private parseExcelWorkbook(file: MicrosoftGraphFile): ExcelWorkbook {
    return {
      id: file.id || '',
      name: file.name || 'Unknown Workbook',
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
      worksheets: undefined, // Will be populated if needed
    };
  }

  /**
   * Handle Excel API errors and convert them to standardized IntegrationError
   */
  private handleExcelError(error: unknown, operation: string, context: Record<string, unknown>): IntegrationError {
    const sphyrError = toSphyrError(error, {
      provider: 'Microsoft Excel',
      operation,
      ...context,
    });

    // Handle specific Microsoft Graph errors
    if ((error as { code?: string }).code === 'InvalidAuthenticationToken') {
      return new IntegrationError(
        'Microsoft Excel',
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
        'Microsoft Excel',
        'Insufficient permissions to access Excel workbooks',
        {
          originalError: error as Error,
          operation,
          context,
          userMessage: 'Insufficient permissions to access your Excel workbooks. Please check your account permissions.',
        }
      );
    }

    if ((error as { code?: string }).code === 'ThrottledRequest') {
      return new IntegrationError(
        'Microsoft Excel',
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
      'Microsoft Excel',
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
