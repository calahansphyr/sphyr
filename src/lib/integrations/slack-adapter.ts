/**
 * Slack Integration Adapter
 * Implements the Adapter Pattern to standardize Slack API interactions
 */

import { WebClient } from '@slack/web-api';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  SlackMessage, 
  SlackSearchOptions, 
  SlackSearchResult,
  SlackApiMessage
} from '@/types/integrations';

export interface SlackAdapterConfig {
  credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
}


export class SlackAdapter {
  private slack!: WebClient;
  private config: SlackAdapterConfig;

  constructor(config: SlackAdapterConfig) {
    this.config = config;
    this.initializeSlackClient();
  }

  /**
   * Initialize the Slack client with OAuth2 credentials
   */
  private initializeSlackClient(): void {
    try {
      this.slack = new WebClient(this.config.tokens.accessToken);
    } catch (error) {
      throw new IntegrationError(
        'Slack',
        'Failed to initialize Slack client',
        {
          originalError: error as Error,
          operation: 'initializeSlackClient',
        }
      );
    }
  }

  /**
   * Search for messages in Slack
   */
  async searchMessages(options: SlackSearchOptions): Promise<SlackSearchResult> {
    try {
      const {
        query,
        limit = 10,
        sort = 'score',
        sortDir = 'desc'
      } = options;

      // Search for messages using the Slack search API
      const response = await this.slack.search.messages({
        query: query.trim(),
        count: limit,
        sort: sort,
        sort_dir: sortDir,
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`);
      }

      const messages = response.messages?.matches || [];
      const totalCount = response.messages?.total || 0;

      return {
        messages: messages.map((message) => this.parseSlackMessage(message as SlackApiMessage)),
        totalCount,
        hasMore: (response.messages?.pagination?.page_count || 0) > 1,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Slack',
        operation: 'searchMessages',
        query: options.query,
      });

      throw new IntegrationError(
        'Slack',
        `Failed to search messages: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'searchMessages',
          query: options.query,
        }
      );
    }
  }

  /**
   * Get a specific message by timestamp
   */
  async getMessage(channel: string, timestamp: string): Promise<SlackMessage> {
    try {
      const response = await this.slack.conversations.history({
        channel,
        latest: timestamp,
        limit: 1,
        inclusive: true,
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`);
      }

      const message = response.messages?.[0];
      if (!message) {
        throw new Error('Message not found');
      }

      return this.parseSlackMessage(message as SlackApiMessage);

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Slack',
        operation: 'getMessage',
        channel,
        timestamp,
      });

      throw new IntegrationError(
        'Slack',
        `Failed to get message: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getMessage',
          channel,
          timestamp,
        }
      );
    }
  }

  /**
   * List channels the user has access to
   */
  async listChannels(): Promise<Array<{ id: string; name: string; isPrivate: boolean }>> {
    try {
      const response = await this.slack.conversations.list({
        types: 'public_channel,private_channel',
        limit: 1000,
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`);
      }

      return (response.channels || []).map((channel: { id?: string; name?: string; is_private?: boolean }) => ({
        id: channel.id || 'unknown',
        name: channel.name || 'unknown',
        isPrivate: channel.is_private || false,
      }));

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Slack',
        operation: 'listChannels',
      });

      throw new IntegrationError(
        'Slack',
        `Failed to list channels: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'listChannels',
        }
      );
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(userId: string): Promise<{ id: string; name: string; realName?: string; email?: string }> {
    try {
      const response = await this.slack.users.info({
        user: userId,
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`);
      }

      const user = response.user;
      if (!user) {
        throw new Error('User not found in response');
      }
      
      return {
        id: user.id || '',
        name: user.name || '',
        realName: user.real_name,
        email: user.profile?.email,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Slack',
        operation: 'getUserInfo',
        userId,
      });

      throw new IntegrationError(
        'Slack',
        `Failed to get user info: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getUserInfo',
          userId,
        }
      );
    }
  }

  /**
   * Get team information
   */
  async getTeamInfo(): Promise<{ id: string; name: string; domain: string }> {
    try {
      const response = await this.slack.team.info();

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`);
      }

      const team = response.team;
      if (!team) {
        throw new Error('Team not found in response');
      }
      
      return {
        id: team.id || '',
        name: team.name || '',
        domain: team.domain || '',
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Slack',
        operation: 'getTeamInfo',
      });

      throw new IntegrationError(
        'Slack',
        `Failed to get team info: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getTeamInfo',
        }
      );
    }
  }

  /**
   * Parse raw Slack message data into our standardized format
   */
  private parseSlackMessage(message: SlackApiMessage): SlackMessage {
    // Extract basic message information
    const text = message.text || '';
    const user = message.user || 'unknown';
    const channel = (message.channel as string) || 'unknown';
    const timestamp = message.ts || '';
    const threadTs = message.thread_ts;

    // Note: permalink and reactions are not used in the current SlackMessage interface

    // Extract attachments
    const attachments = message.attachments?.map((attachment) => ({
      title: attachment.title,
      text: attachment.text,
      fallback: attachment.fallback || 'No fallback text',
    }));

    return {
      id: `${channel}-${timestamp}`,
      channelId: channel,
      channelName: channel, // We don't have channel name from the API, so use ID
      text,
      user,
      userName: user, // We don't have user name from the API, so use ID
      timestamp,
      threadTs,
      attachments,
    };
  }

  /**
   * Test the connection to Slack
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.slack.auth.test();
      return response.ok === true;
    } catch {
      return false;
    }
  }
}
