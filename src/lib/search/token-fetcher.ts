/**
 * Token Fetcher Module
 * Handles parallel OAuth token fetching from Supabase
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { IntegrationError } from '@/lib/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

export interface OAuthTokens {
  google?: {
    accessToken: string;
    refreshToken: string;
  };
  slack?: {
    accessToken: string;
    refreshToken: string;
  };
  asana?: {
    accessToken: string;
    refreshToken: string;
  };
  quickbooks?: {
    accessToken: string;
    refreshToken: string;
    companyId: string;
  };
  microsoft?: {
    accessToken: string;
    refreshToken: string;
  };
  procore?: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface TokenFetchResult {
  tokens: OAuthTokens;
  authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null;
}

export interface OAuthTokenRecord {
  access_token: string;
  refresh_token: string;
  metadata?: string;
  expires_at?: string;
}

export class TokenFetcher {
  constructor(
    private req?: NextApiRequest,
    private res?: NextApiResponse
  ) {}

  /**
   * Fetch all OAuth tokens for a user with optimized single query
   */
  async fetchAllTokens(userId: string): Promise<TokenFetchResult> {
    const supabase = createClient(this.req, this.res);
    
    // Fetch all tokens in a single optimized query
    const { data: tokenRecords, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .in('provider', ['google', 'slack', 'asana', 'quickbooks', 'microsoft', 'procore']);

    if (error) {
      throw new IntegrationError(
        'Database',
        'Failed to fetch OAuth tokens from database',
        { error: error.message, userId }
      );
    }

    const tokens: OAuthTokens = {};

    // Process tokens from the single query result
    if (tokenRecords && tokenRecords.length > 0) {
      // Create a map for quick lookup
      const tokenMap = new Map(tokenRecords.map(record => [record.provider, record]));

      // Process Google tokens (required)
      const googleTokens = tokenMap.get('google');
      if (googleTokens) {
        tokens.google = {
          accessToken: googleTokens.access_token_encrypted,
          refreshToken: googleTokens.refresh_token_encrypted,
        };
      } else {
        throw new IntegrationError(
          'Google',
          'No Google account connected. Please connect your Google account in Settings.',
          { error: 'No Google tokens found', userId }
        );
      }

      // Process optional tokens
      const slackTokens = tokenMap.get('slack');
      if (slackTokens) {
        tokens.slack = {
          accessToken: slackTokens.access_token_encrypted,
          refreshToken: slackTokens.refresh_token_encrypted,
        };
      }

      const asanaTokens = tokenMap.get('asana');
      if (asanaTokens) {
        tokens.asana = {
          accessToken: asanaTokens.access_token_encrypted,
          refreshToken: asanaTokens.refresh_token_encrypted,
        };
      }

      const quickbooksTokens = tokenMap.get('quickbooks');
      if (quickbooksTokens) {
        tokens.quickbooks = {
          accessToken: quickbooksTokens.access_token_encrypted,
          refreshToken: quickbooksTokens.refresh_token_encrypted,
          companyId: quickbooksTokens.metadata ? JSON.parse(quickbooksTokens.metadata).companyId : 'default',
        };
      }

      const microsoftTokens = tokenMap.get('microsoft');
      if (microsoftTokens) {
        tokens.microsoft = {
          accessToken: microsoftTokens.access_token_encrypted,
          refreshToken: microsoftTokens.refresh_token_encrypted,
        };
      }

      const procoreTokens = tokenMap.get('procore');
      if (procoreTokens) {
        tokens.procore = {
          accessToken: procoreTokens.access_token_encrypted,
          refreshToken: procoreTokens.refresh_token_encrypted,
        };
      }
    } else {
      // No tokens found at all
      throw new IntegrationError(
        'Google',
        'No Google account connected. Please connect your Google account in Settings.',
        { error: 'No tokens found for user', userId }
      );
    }

    logger.info('OAuth tokens fetched successfully with optimized query', {
      providers: Object.keys(tokens),
      userId,
      totalRecords: tokenRecords.length,
    });

    return { tokens, authUser: null }; // authUser will be set by caller
  }

  /**
   * Validate and refresh tokens if needed
   */
  async validateTokens(tokens: OAuthTokens): Promise<OAuthTokens> {
    try {
      // Basic token validation - check if tokens exist for each provider
      const providers = Object.keys(tokens) as Array<keyof OAuthTokens>;
      const validProviders: string[] = [];
      const invalidProviders: string[] = [];
      
      for (const provider of providers) {
        const providerTokens = tokens[provider];
        if (providerTokens && providerTokens.accessToken && providerTokens.refreshToken) {
          validProviders.push(provider);
        } else {
          invalidProviders.push(provider);
        }
      }
      
      if (invalidProviders.length > 0) {
        logger.warn('Some OAuth tokens are missing or invalid', {
          operation: 'token_validation',
          component: 'TokenFetcher',
          validProviders,
          invalidProviders
        });
      }
      
      // For now, return the tokens as-is since refresh logic would require provider-specific implementation
      // In a production environment, this would call the appropriate OAuth refresh endpoint
      return tokens;
    } catch (error) {
      logger.error('Token validation failed', error as Error, {
        operation: 'token_validation',
        component: 'TokenFetcher'
      });
      return tokens;
    }
  }
}
