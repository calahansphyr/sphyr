/**
 * Microsoft Outlook Integration Adapter
 * Implements the Adapter Pattern to standardize Microsoft Graph API interactions
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  OutlookMessage, 
  OutlookSearchOptions, 
  OutlookSearchResult, 
  OutlookAttachment,
  MicrosoftGraphMessage,
  MicrosoftGraphMailFolder,
  MicrosoftGraphAttachment
} from '@/types/integrations';

export interface OutlookAdapterConfig {
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

export class OutlookAdapter {
  private graphClient!: Client;
  private msalApp!: ConfidentialClientApplication;
  private config: OutlookAdapterConfig;

  constructor(config: OutlookAdapterConfig) {
    this.config = config;
    this.initializeOutlookClient();
  }

  /**
   * Initialize the Microsoft Graph client with OAuth2 credentials
   */
  private initializeOutlookClient(): void {
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
        'Microsoft Outlook',
        'Failed to initialize Outlook client',
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
        scopes: ['https://graph.microsoft.com/Mail.Read'],
      });

      return {
        accessToken: refreshResult?.accessToken || '',
        refreshToken: this.config.tokens.refreshToken, // Keep existing refresh token
      };
    } catch (error) {
      throw new IntegrationError(
        'Microsoft Outlook',
        'Failed to refresh access token',
        {
          originalError: error as Error,
          operation: 'refreshAccessToken',
        }
      );
    }
  }

  /**
   * Search for messages in Outlook
   */
  async searchEmails(options: OutlookSearchOptions): Promise<OutlookSearchResult> {
    try {
      const { query, limit = 10, skip = 0, folderId = 'inbox' } = options;

      // Build the search query for Microsoft Graph
      const searchQuery = {
        search: query.trim(),
        orderby: 'receivedDateTime desc',
        top: limit,
        skip: skip,
      };

      // Search messages in the specified folder
      const response = await this.graphClient
        .api(`/me/mailFolders/${folderId}/messages`)
        .search(searchQuery.search)
        .orderby(searchQuery.orderby)
        .top(searchQuery.top)
        .skip(searchQuery.skip)
        .select('id,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,bodyPreview,body,hasAttachments,importance,isRead,isDraft,conversationId,internetMessageId')
        .get();

      const messages = (response.value as MicrosoftGraphMessage[]) || [];
      const totalCount = response['@odata.count'] || messages.length;
      const hasMore = messages.length === limit;

      // Fetch full message details for each message
      const fullMessages = await Promise.all(
        messages.map((message: MicrosoftGraphMessage) => this.parseOutlookMessage(message))
      );

      return {
        messages: fullMessages,
        totalCount,
        hasMore,
      };
    } catch (error) {
      throw this.handleOutlookError(error, 'searchEmails', { options });
    }
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string): Promise<OutlookMessage> {
    try {
      const response = await this.graphClient
        .api(`/me/messages/${messageId}`)
        .select('id,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,bodyPreview,body,hasAttachments,importance,isRead,isDraft,conversationId,internetMessageId,attachments')
        .get();

      return this.parseOutlookMessage(response);
    } catch (error) {
      throw this.handleOutlookError(error, 'getMessage', { messageId });
    }
  }

  /**
   * Get message attachments
   */
  async getMessageAttachments(messageId: string): Promise<OutlookAttachment[]> {
    try {
      const response = await this.graphClient
        .api(`/me/messages/${messageId}/attachments`)
        .select('id,name,contentType,size,isInline,contentId')
        .get();

      const attachments = (response.value as MicrosoftGraphAttachment[]) || [];
      return attachments.map((attachment) => this.parseOutlookAttachment(attachment));
    } catch (error) {
      throw this.handleOutlookError(error, 'getMessageAttachments', { messageId });
    }
  }

  /**
   * Get user's mail folders
   */
  async getMailFolders(): Promise<Array<{ id: string; name: string; unreadItemCount: number }>> {
    try {
      const response = await this.graphClient
        .api('/me/mailFolders')
        .select('id,displayName,unreadItemCount')
        .get();

      const folders = (response.value as MicrosoftGraphMailFolder[]) || [];
      return folders.map((folder: MicrosoftGraphMailFolder) => ({
        id: folder.id || '',
        name: folder.displayName || 'Unknown Folder',
        unreadItemCount: folder.unreadItemCount || 0,
      }));
    } catch (error) {
      throw this.handleOutlookError(error, 'getMailFolders', {});
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
      throw this.handleOutlookError(error, 'getUserInfo', {});
    }
  }

  /**
   * Parse raw Outlook message data into our standardized format
   */
  private parseOutlookMessage(message: MicrosoftGraphMessage): OutlookMessage {
    return {
      id: message.id || '',
      subject: message.subject || 'No Subject',
      from: message.from?.emailAddress?.address || 'Unknown Sender',
      to: (message.toRecipients || []).map((recipient) => recipient.emailAddress?.address || ''),
      cc: (message.ccRecipients || []).map((recipient) => recipient.emailAddress?.address || ''),
      bcc: (message.bccRecipients || []).map((recipient) => recipient.emailAddress?.address || ''),
      receivedDateTime: message.receivedDateTime || new Date().toISOString(),
      bodyPreview: message.bodyPreview || '',
      body: message.body?.content || '',
      hasAttachments: message.hasAttachments || false,
      attachments: message.attachments ? message.attachments.map((attachment) => this.parseOutlookAttachment(attachment)) : undefined,
      importance: message.importance || 'normal',
      isRead: message.isRead || false,
      isDraft: message.isDraft || false,
      conversationId: (message as { conversationId?: string }).conversationId || undefined,
      internetMessageId: (message as { internetMessageId?: string }).internetMessageId || undefined,
    };
  }

  /**
   * Parse raw Outlook attachment data into our standardized format
   */
  private parseOutlookAttachment(attachment: MicrosoftGraphAttachment): OutlookAttachment {
    return {
      id: attachment.id || '',
      name: attachment.name || 'Unknown Attachment',
      contentType: attachment.contentType || 'application/octet-stream',
      size: attachment.size || 0,
      isInline: attachment.isInline || false,
      contentId: attachment.contentId || undefined,
    };
  }

  /**
   * Handle Outlook API errors and convert them to standardized IntegrationError
   */
  private handleOutlookError(error: unknown, operation: string, context: Record<string, unknown>): IntegrationError {
    const sphyrError = toSphyrError(error, {
      provider: 'Microsoft Outlook',
      operation,
      ...context,
    });

    // Handle specific Microsoft Graph errors
    if ((error as { code?: string }).code === 'InvalidAuthenticationToken') {
      return new IntegrationError(
        'Microsoft Outlook',
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
        'Microsoft Outlook',
        'Insufficient permissions to access Outlook data',
        {
          originalError: error as Error,
          operation,
          context,
          userMessage: 'Insufficient permissions to access your Outlook data. Please check your account permissions.',
        }
      );
    }

    if ((error as { code?: string }).code === 'ThrottledRequest') {
      return new IntegrationError(
        'Microsoft Outlook',
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
      'Microsoft Outlook',
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
