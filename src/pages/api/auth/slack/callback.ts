/**
 * Slack OAuth Callback API Route
 * Handles the OAuth 2.0 callback from Slack
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { reportError } from '@/lib/monitoring';
import { ValidationError, AuthenticationError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { OAuthCallbackSchema } from '@/lib/schemas';
import { productAnalytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Validate query parameters using Zod schema
    const validationResult = OAuthCallbackSchema.safeParse(req.query);
    if (!validationResult.success) {
      const validationError = new ValidationError(
        'Invalid OAuth callback parameters',
        'oauth_callback',
        req.query,
        { validationErrors: validationResult.error.issues }
      );
      await reportError(validationError, { endpoint: '/api/auth/slack/callback', operation: 'validateCallback' });
      return res.redirect(302, '/integrations?error=invalid_callback');
    }

    const { code, state, error } = validationResult.data;

    // Create Supabase client
    const supabase = createClient(req, res);

    // Check for OAuth error
    if (error) {
      const authError = new AuthenticationError(
        `Slack OAuth error: ${error}`,
        { error, state }
      );
      await reportError(authError, { endpoint: '/api/auth/slack/callback', operation: 'slackOAuthError' });
      return res.redirect(302, '/integrations?error=slack_oauth_failed');
    }

    // Validate required parameters
    if (!code || !state) {
      const validationError = new ValidationError(
        'Missing required OAuth parameters',
        'query',
        { code: !!code, state: !!state }
      );
      await reportError(validationError, { endpoint: '/api/auth/slack/callback', operation: 'validateOAuthParams' });
      return res.redirect(302, '/integrations?error=invalid_oauth_response');
    }

    // Check if authorization code has already been used (idempotency)
    const { data: codeUsed, error: codeCheckError } = await supabase.rpc('is_authorization_code_used', {
      auth_code: code
    });

    if (codeCheckError) {
      logger.warn('Failed to check authorization code usage', {
        operation: 'check_authorization_code',
        endpoint: '/api/auth/slack/callback',
        provider: 'slack',
        error: codeCheckError.message
      });
    } else if (codeUsed) {
      // Code has already been used, get existing token info
      const { data: existingToken, error: tokenError } = await supabase.rpc('get_token_by_authorization_code', {
        auth_code: code
      });

      if (tokenError) {
        logger.warn('Failed to get existing token info', {
          operation: 'get_existing_token',
          endpoint: '/api/auth/slack/callback',
          provider: 'slack',
          error: tokenError.message
        });
      } else if (existingToken && existingToken.length > 0) {
        logger.info('Authorization code already used, redirecting to success', {
          operation: 'duplicate_authorization_code',
          endpoint: '/api/auth/slack/callback',
          provider: 'slack',
          tokenId: existingToken[0].id,
          userId: existingToken[0].user_id,
          createdAt: existingToken[0].created_at
        });
      }

      // Redirect to success page without processing again
      return res.redirect(302, '/integrations?success=slack_connected&message=already_connected');
    }

    // Validate state parameter (CSRF protection)
    const cookieState = req.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('slack_oauth_state='))
      ?.split('=')[1];

    if (state !== cookieState) {
      const authError = new AuthenticationError(
        'Invalid OAuth state parameter',
        { receivedState: state, expectedState: cookieState }
      );
      await reportError(authError, { endpoint: '/api/auth/slack/callback', operation: 'validateOAuthState' });
      return res.redirect(302, '/integrations?error=invalid_state');
    }

    // Get current user session
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

    if (userError || !authUser) {
      const authError = new AuthenticationError(
        'User must be authenticated to connect Slack',
        { userError: userError?.message }
      );
      await reportError(authError, { endpoint: '/api/auth/slack/callback', operation: 'getUser' });
      return res.redirect(302, '/login?redirect=/integrations');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code: code as string,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/slack/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      throw new Error(`Slack API error: ${tokenData.error}`);
    }

    // Save tokens to Supabase with authorization code
    const { error: saveError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: authUser.id,
        organization_id: authUser.user_metadata?.organization_id || null,
        provider: 'slack',
        access_token_encrypted: tokenData.access_token,
        refresh_token_encrypted: tokenData.refresh_token || null,
        expires_at: null, // Slack tokens don't expire
        scope: tokenData.scope,
        authorization_code: code,
        metadata: JSON.stringify({
          team_id: tokenData.team?.id,
          team_name: tokenData.team?.name,
          authed_user_id: tokenData.authed_user?.id,
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider'
      });

    if (saveError) {
      throw new Error(`Failed to save Slack tokens: ${saveError.message}`);
    }

    // Clear the OAuth state cookie
    res.setHeader('Set-Cookie', 'slack_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

    // Track integration connection event
    try {
      await productAnalytics.trackIntegrationConnected(
        authUser.id,
        authUser.user_metadata?.organization_id || 'unknown',
        'slack',
        'Slack',
        {
          scopes: tokenData.scope,
          team_id: tokenData.team?.id,
          team_name: tokenData.team?.name,
        }
      );
    } catch (analyticsError) {
      logger.warn('Failed to track Slack integration analytics', {
        operation: 'analytics_tracking',
        endpoint: '/api/auth/slack/callback',
        provider: 'slack',
        userId: user.id,
        error: analyticsError instanceof Error ? analyticsError.message : 'Unknown analytics error'
      });
    }

    // Redirect to integrations page with success message
    res.redirect(302, '/integrations?success=slack_connected');

  } catch (error) {
    logger.error('Slack OAuth callback failed', error, {
      operation: 'oauth_callback',
      endpoint: '/api/auth/slack/callback',
      provider: 'slack'
    });
    
    // Report error to monitoring service
    await reportError(error as Error, {
      endpoint: '/api/auth/slack/callback',
      operation: 'slackOAuthCallback',
    });

    res.redirect(302, '/integrations?error=slack_connection_failed');
  }
}
