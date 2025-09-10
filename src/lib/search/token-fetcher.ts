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
  authUser: unknown; // TODO: Replace with proper Supabase user type
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
   * Fetch all OAuth tokens for a user in parallel
   */
  async fetchAllTokens(userId: string): Promise<TokenFetchResult> {
    const supabase = createClient(this.req, this.res);
    
    // Fetch all tokens in parallel
    const [
      googleResult,
      slackResult,
      asanaResult,
      quickbooksResult,
      microsoftResult,
      procoreResult
    ] = await Promise.allSettled([
      supabase.from('oauth_tokens').select('*').eq('user_id', userId).eq('provider', 'google').single(),
      supabase.from('oauth_tokens').select('*').eq('user_id', userId).eq('provider', 'slack').single(),
      supabase.from('oauth_tokens').select('*').eq('user_id', userId).eq('provider', 'asana').single(),
      supabase.from('oauth_tokens').select('*').eq('user_id', userId).eq('provider', 'quickbooks').single(),
      supabase.from('oauth_tokens').select('*').eq('user_id', userId).eq('provider', 'microsoft').single(),
      supabase.from('oauth_tokens').select('*').eq('user_id', userId).eq('provider', 'procore').single(),
    ]);

    const tokens: OAuthTokens = {};

    // Process Google tokens (required)
    if (googleResult.status === 'fulfilled' && googleResult.value.data) {
      const googleTokens = googleResult.value.data as OAuthTokenRecord;
      tokens.google = {
        accessToken: googleTokens.access_token,
        refreshToken: googleTokens.refresh_token,
      };
    } else {
      throw new IntegrationError(
        'Google',
        'No Google account connected. Please connect your Google account in Settings.',
        { error: googleResult.status === 'rejected' ? googleResult.reason : 'No tokens found' }
      );
    }

    // Process optional tokens
    if (slackResult.status === 'fulfilled' && slackResult.value.data) {
      const slackTokens = slackResult.value.data as OAuthTokenRecord;
      tokens.slack = {
        accessToken: slackTokens.access_token,
        refreshToken: slackTokens.refresh_token,
      };
    }

    if (asanaResult.status === 'fulfilled' && asanaResult.value.data) {
      const asanaTokens = asanaResult.value.data as OAuthTokenRecord;
      tokens.asana = {
        accessToken: asanaTokens.access_token,
        refreshToken: asanaTokens.refresh_token,
      };
    }

    if (quickbooksResult.status === 'fulfilled' && quickbooksResult.value.data) {
      const quickbooksTokens = quickbooksResult.value.data as OAuthTokenRecord;
      tokens.quickbooks = {
        accessToken: quickbooksTokens.access_token,
        refreshToken: quickbooksTokens.refresh_token,
        companyId: quickbooksTokens.metadata ? JSON.parse(quickbooksTokens.metadata).companyId : 'default',
      };
    }

    if (microsoftResult.status === 'fulfilled' && microsoftResult.value.data) {
      const microsoftTokens = microsoftResult.value.data as OAuthTokenRecord;
      tokens.microsoft = {
        accessToken: microsoftTokens.access_token,
        refreshToken: microsoftTokens.refresh_token,
      };
    }

    if (procoreResult.status === 'fulfilled' && procoreResult.value.data) {
      const procoreTokens = procoreResult.value.data as OAuthTokenRecord;
      tokens.procore = {
        accessToken: procoreTokens.access_token,
        refreshToken: procoreTokens.refresh_token,
      };
    }

    logger.info('OAuth tokens fetched successfully', {
      providers: Object.keys(tokens),
      userId,
    });

    return { tokens, authUser: null }; // authUser will be set by caller
  }

  /**
   * Validate and refresh tokens if needed
   */
  async validateTokens(tokens: OAuthTokens): Promise<OAuthTokens> {
    // TODO: Implement token validation and refresh logic
    return tokens;
  }
}
