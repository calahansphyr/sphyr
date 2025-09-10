/**
 * Google OAuth Callback API Route
 * Handles the OAuth callback from Google and stores tokens securely
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { ValidationError, AuthenticationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { OAuthCallbackSchema } from '@/lib/schemas';
import { productAnalytics } from '@/lib/analytics';

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
      await reportError(validationError, { endpoint: '/api/auth/google/callback', operation: 'validateCallback' });
      return res.redirect(302, '/integrations?error=invalid_callback');
    }

    const { code, error: oauthError } = validationResult.data;

    // Check for OAuth errors
    if (oauthError) {
      logger.error('OAuth error from Google', new Error(oauthError), {
        operation: 'oauth_callback',
        endpoint: '/api/auth/google/callback',
        provider: 'google',
        oauthError
      });
      return res.redirect(302, '/integrations?error=oauth_denied');
    }

    // Validate the authorization code
    if (!code) {
      const validationError = new ValidationError(
        'Authorization code is missing from OAuth callback',
        'oauth_code',
        { code: !!code }
      );
      await reportError(validationError, { endpoint: '/api/auth/google/callback', operation: 'validateCode' });
      return res.redirect(302, '/integrations?error=missing_code');
    }

    // Check if authorization code has already been used (idempotency)
    const supabase = createClient(req, res);
    const { data: codeUsed, error: codeCheckError } = await supabase.rpc('is_authorization_code_used', {
      auth_code: code
    });

    if (codeCheckError) {
      logger.warn('Failed to check authorization code usage', {
        error: codeCheckError.message,
        code: code.substring(0, 10) + '...'
      });
    } else if (codeUsed) {
      // Code has already been used, get existing token info
      const { data: existingToken, error: tokenError } = await supabase.rpc('get_token_by_authorization_code', {
        auth_code: code
      });

      if (tokenError) {
        logger.warn('Failed to get existing token info', {
          error: tokenError.message,
          code: code.substring(0, 10) + '...'
        });
      } else if (existingToken && existingToken.length > 0) {
        logger.info('Authorization code already used, redirecting to success', {
          tokenId: existingToken[0].id,
          userId: existingToken[0].user_id,
          provider: existingToken[0].provider,
          createdAt: existingToken[0].created_at
        });
      }

      // Redirect to success page without processing again
      return res.redirect(302, '/integrations?success=google_connected&message=already_connected');
    }

    // Get current user (supabase client already created above)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      const authError = new AuthenticationError(
        'User must be authenticated to connect Google account',
        { userError: userError?.message }
      );
      await reportError(authError, { endpoint: '/api/auth/google/callback', operation: 'getUser' });
      return res.redirect(302, '/auth/login?redirect=/integrations');
    }

    // Validate environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      const validationError = new ValidationError(
        'Google OAuth configuration is missing',
        'oauth_config',
        { clientId: !!clientId, clientSecret: !!clientSecret, baseUrl: !!baseUrl }
      );
      await reportError(validationError, { endpoint: '/api/auth/google/callback', operation: 'validateConfig' });
      return res.redirect(302, '/integrations?error=config_error');
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${baseUrl}/api/auth/google/callback`
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      const validationError = new ValidationError(
        'Failed to obtain access token from Google',
        'oauth_tokens',
        { hasAccessToken: !!tokens.access_token }
      );
      await reportError(validationError, { endpoint: '/api/auth/google/callback', operation: 'getTokens' });
      return res.redirect(302, '/integrations?error=token_error');
    }

    logger.info('Successfully obtained Google OAuth tokens', {
      operation: 'oauth_token_exchange',
      endpoint: '/api/auth/google/callback',
      provider: 'google',
      userId: user.id
    });

    // Store tokens securely in Supabase with authorization code
    const { error: insertError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: user.id,
        organization_id: user.user_metadata?.organization_id || null,
        provider: 'google',
        access_token_encrypted: tokens.access_token,
        refresh_token_encrypted: tokens.refresh_token || null,
        token_type: tokens.token_type || 'Bearer',
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        scope: tokens.scope || null,
        authorization_code: code,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider'
      });

    if (insertError) {
      logger.error('Failed to store OAuth tokens', insertError, {
        operation: 'store_tokens',
        endpoint: '/api/auth/google/callback',
        provider: 'google',
        userId: user.id
      });
      await reportError(insertError, { 
        endpoint: '/api/auth/google/callback', 
        operation: 'storeTokens',
        userId: user.id
      });
      return res.redirect(302, '/integrations?error=storage_error');
    }

    logger.info('Successfully stored Google OAuth tokens', {
      operation: 'token_storage',
      endpoint: '/api/auth/google/callback',
      provider: 'google',
      userId: user.id
    });

    // Track integration connection event
    try {
      await productAnalytics.trackIntegrationConnected(
        user.id,
        user.user_metadata?.organization_id || 'unknown',
        'google',
        'Google Workspace',
        {
          scopes: tokens.scope || 'unknown',
          services: 'gmail,drive,calendar,docs,sheets,people',
        }
      );
    } catch (analyticsError) {
      logger.warn('Failed to track Google integration analytics', {
        operation: 'analytics_tracking',
        endpoint: '/api/auth/google/callback',
        provider: 'google',
        userId: user.id,
        error: analyticsError instanceof Error ? analyticsError.message : 'Unknown analytics error'
      });
    }

    // Redirect to integrations page with success message
    res.redirect(302, '/integrations?success=google_connected');

  } catch (error) {
    logger.error('Google OAuth callback failed', error, {
      operation: 'oauth_callback',
      endpoint: '/api/auth/google/callback',
      provider: 'google'
    });
    
    // Report error to monitoring service
    await reportError(error as Error, {
      endpoint: '/api/auth/google/callback',
      operation: 'handleCallback',
    });

    res.redirect(302, '/integrations?error=callback_error');
  }
}
