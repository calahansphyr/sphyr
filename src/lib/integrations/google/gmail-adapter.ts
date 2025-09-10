/**
 * Google Gmail Integration Adapter
 * Implements the Adapter Pattern to standardize Gmail API interactions
 */

import { google, gmail_v1 } from 'googleapis';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import { withRetry, DEFAULT_RETRY_CONFIG } from '@/lib/resilience';
import type { 
  GmailMessage, 
  GmailSearchOptions, 
  GmailSearchResult
} from '@/types/integrations';

export interface GmailAdapterConfig {
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

export class GmailAdapter {
  private gmail!: gmail_v1.Gmail;
  private config: GmailAdapterConfig;

  constructor(config: GmailAdapterConfig) {
    this.config = config;
    this.initializeGmailClient();
  }

  /**
   * Initialize the Gmail client with OAuth2 credentials
   */
  private initializeGmailClient(): void {
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

      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    } catch (error) {
      throw new IntegrationError(
        'Google Gmail',
        'Failed to initialize Gmail client',
        {
          originalError: error as Error,
          config: {
            clientId: this.config.credentials.clientId,
            redirectUri: this.config.credentials.redirectUri,
          },
        }
      );
    }
  }

  /**
   * Search for messages in Gmail
   */
  async searchMessages(options: GmailSearchOptions): Promise<GmailSearchResult> {
    const retryResult = await withRetry(
      async () => {
        const response = await this.gmail.users.messages.list({
          userId: 'me',
          q: options.query,
          maxResults: options.limit || 10,
          pageToken: options.pageToken,
        });

        const messages = response.data.messages || [];
        const nextPageToken = response.data.nextPageToken || undefined;

        // Fetch full message details for each message
        const fullMessages = await Promise.all(
          messages.map((message) => this.getMessage(message.id!))
        );

        return {
          messages: fullMessages,
          nextPageToken,
          totalCount: response.data.resultSizeEstimate || 0,
        };
      },
      DEFAULT_RETRY_CONFIG
    );

    if (!retryResult.success) {
      throw this.handleGmailError(retryResult.error!, 'searchMessages', { options });
    }

    return retryResult.data!;
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    const retryResult = await withRetry(
      async () => {
        const response = await this.gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });

        return this.parseGmailMessage(response.data);
      },
      DEFAULT_RETRY_CONFIG
    );

    if (!retryResult.success) {
      throw this.handleGmailError(retryResult.error!, 'getMessage', { messageId });
    }

    return retryResult.data!;
  }

  /**
   * Get user's Gmail profile information
   */
  async getProfile(): Promise<{ emailAddress: string; messagesTotal: number; threadsTotal: number }> {
    try {
      const response = await this.gmail.users.getProfile({
        userId: 'me',
      });

      return {
        emailAddress: response.data.emailAddress || '',
        messagesTotal: response.data.messagesTotal || 0,
        threadsTotal: response.data.threadsTotal || 0,
      };
    } catch (error) {
      throw this.handleGmailError(error, 'getProfile');
    }
  }

  /**
   * Send a message via Gmail
   */
  async sendMessage(message: {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Promise<{ id: string; threadId: string }> {
    try {
      const rawMessage = this.createRawMessage(message);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMessage,
        },
      });

      return {
        id: response.data.id || '',
        threadId: response.data.threadId || '',
      };
    } catch (error) {
      throw this.handleGmailError(error, 'sendMessage', { message });
    }
  }

  /**
   * Create a raw message for sending
   */
  private createRawMessage(message: {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }): string {
    const contentType = message.isHtml ? 'text/html' : 'text/plain';
    const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);
    
    const rawMessage = [
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: ${contentType}; charset="UTF-8"`,
      '',
      message.body,
      `--${boundary}--`,
    ].join('\n');

    return Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Parse Gmail message response into our standardized format
   */
  private parseGmailMessage(gmailMessage: gmail_v1.Schema$Message): GmailMessage {
    const headers = gmailMessage.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value;

    const body = this.extractMessageBody(gmailMessage.payload);

    return {
      id: gmailMessage.id || '',
      threadId: gmailMessage.threadId || '',
      subject: getHeader('Subject') || '',
      from: getHeader('From') || '',
      to: getHeader('To') || '',
      date: getHeader('Date') || '',
      snippet: gmailMessage.snippet || '',
      body,
      labels: gmailMessage.labelIds || [],
      sizeEstimate: gmailMessage.sizeEstimate || 0,
    };
  }

  /**
   * Extract message body from Gmail payload
   */
  private extractMessageBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    if (!payload) return '';

    // Handle multipart messages
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
        }
        // Recursively check nested parts
        if (part.parts) {
          const nestedBody = this.extractMessageBody(part);
          if (nestedBody) return nestedBody;
        }
      }
    }

    // Handle single part messages
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    return '';
  }

  /**
   * Handle Gmail API errors and convert them to standardized SphyrError
   */
  private handleGmailError(error: unknown, operation: string, context: Record<string, unknown> = {}): IntegrationError {
    const sphyrError = toSphyrError(error, {
      provider: 'Google Gmail',
      operation,
      ...context,
    });

    // Handle specific Gmail API error codes
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code?: number }).code;
      
      if (errorCode === 401) {
        return new IntegrationError(
          'Google Gmail',
          'Authentication failed. Please reconnect your Gmail account.',
          {
            originalError: error as unknown as Error,
            operation,
            ...context,
          }
        );
      }

      if (errorCode === 403) {
        return new IntegrationError(
          'Google Gmail',
          'Insufficient permissions. Please check your Gmail access permissions.',
          {
            originalError: error as unknown as Error,
            operation,
            ...context,
          }
        );
      }

      if (errorCode === 429) {
        return new IntegrationError(
          'Google Gmail',
          'Rate limit exceeded. Please try again later.',
          {
            originalError: error as unknown as Error,
            operation,
            ...context,
          }
        );
      }

      if (errorCode && errorCode >= 500) {
        return new IntegrationError(
          'Google Gmail',
          'Gmail service is temporarily unavailable. Please try again later.',
          {
            originalError: error as unknown as Error,
            operation,
            ...context,
          }
        );
      }
    }

    // For any other error, wrap it as an IntegrationError
    return new IntegrationError(
      'Google Gmail',
      sphyrError.message,
      {
        originalError: error as Error,
        operation,
        ...context,
      }
    );
  }

  /**
   * Refresh OAuth2 tokens
   */
  async refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const oauth2Client = this.gmail.context._options.auth;
      if (!oauth2Client || typeof oauth2Client === 'string') {
        throw new Error('Invalid OAuth2 client');
      }
      
      const { credentials } = await (oauth2Client as { refreshAccessToken: () => Promise<{ credentials: { access_token?: string; refresh_token?: string } }> }).refreshAccessToken();
      
      return {
        accessToken: credentials.access_token || '',
        refreshToken: credentials.refresh_token || '',
      };
    } catch (error) {
      throw this.handleGmailError(error, 'refreshTokens');
    }
  }

  /**
   * Test the connection to Gmail
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
