/**
 * Procore OAuth Callback API Route
 * Handles the OAuth 2.0 callback from Procore
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
      await reportError(validationError, { endpoint: '/api/auth/procore/callback', operation: 'validateCallback' });
      return res.redirect(302, '/integrations?error=invalid_callback');
    }

    const { code, state, error } = validationResult.data;

    // Create Supabase client
    const supabase = createClient(req, res);

    // Check for OAuth error
    if (error) {
      const authError = new AuthenticationError(
        `Procore OAuth error: ${error}`,
        { error, state }
      );
      await reportError(authError, { endpoint: '/api/auth/procore/callback', operation: 'procoreOAuthError' });
      return res.redirect(302, '/integrations?error=procore_oauth_failed');
    }

    // Validate required parameters
    if (!code || !state) {
      const validationError = new ValidationError(
        'Missing required OAuth parameters',
        'query',
        { code: !!code, state: !!state }
      );
      await reportError(validationError, { endpoint: '/api/auth/procore/callback', operation: 'validateOAuthParams' });
      return res.redirect(302, '/integrations?error=invalid_oauth_response');
    }

    // Check if authorization code has already been used (idempotency)
    const { data: codeUsed, error: codeCheckError } = await supabase.rpc('is_authorization_code_used', {
      auth_code: code
    });

    if (codeCheckError) {
      logger.warn('Failed to check authorization code usage', {
        operation: 'check_authorization_code',
        endpoint: '/api/auth/procore/callback',
        provider: 'procore',
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
          endpoint: '/api/auth/procore/callback',
          provider: 'procore',
          error: tokenError.message
        });
      } else if (existingToken && existingToken.length > 0) {
        logger.info('Authorization code already used, redirecting to success', {
          operation: 'duplicate_authorization_code',
          endpoint: '/api/auth/procore/callback',
          provider: 'procore',
          tokenId: existingToken[0].id,
          userId: existingToken[0].user_id,
          createdAt: existingToken[0].created_at
        });
      }

      // Redirect to success page without processing again
      return res.redirect(302, '/integrations?success=procore_connected&message=already_connected');
    }

    // Validate state parameter (CSRF protection)
    const cookieState = req.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('procore_oauth_state='))
      ?.split('=')[1];

    if (state !== cookieState) {
      const authError = new AuthenticationError(
        'Invalid OAuth state parameter',
        { receivedState: state, expectedState: cookieState }
      );
      await reportError(authError, { endpoint: '/api/auth/procore/callback', operation: 'validateOAuthState' });
      return res.redirect(302, '/integrations?error=invalid_state');
    }

    // Get current user session
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

    if (userError || !authUser) {
      const authError = new AuthenticationError(
        'User must be authenticated to connect Procore account',
        { userError: userError?.message }
      );
      await reportError(authError, { endpoint: '/api/auth/procore/callback', operation: 'getUser' });
      return res.redirect(302, '/login?redirect=/integrations');
    }

    // Exchange code for tokens
    const tokenRequest = {
      client_id: process.env.PROCORE_CLIENT_ID!,
      client_secret: process.env.PROCORE_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/procore/callback`,
    };

    const baseUrl = process.env.PROCORE_BASE_URL || 'https://api.procore.com';
    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(tokenRequest),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to obtain access token from Procore: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to obtain access token from Procore');
    }

    // Get user information from Procore
    let userInfo = null;
    try {
      const userResponse = await fetch(`${baseUrl}/rest/v1.0/me`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (userResponse.ok) {
        userInfo = await userResponse.json();
      }
    } catch (error) {
      logger.warn('Failed to fetch Procore user info', {
        operation: 'fetch_user_info',
        endpoint: '/api/auth/procore/callback',
        provider: 'procore',
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Continue without user info
    }

    // Save tokens to Supabase with authorization code
    const { error: saveError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: authUser.id,
        organization_id: authUser.user_metadata?.organization_id || null,
        provider: 'procore',
        access_token_encrypted: tokenData.access_token,
        refresh_token_encrypted: tokenData.refresh_token || null,
        expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        scope: tokenData.scope || 'read:project read:document read:rfi',
        authorization_code: code,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Store user info and base URL in metadata
        metadata: JSON.stringify({ 
          userInfo,
          baseUrl,
          companyId: userInfo?.company?.id,
          companyName: userInfo?.company?.name,
        }),
      }, {
        onConflict: 'user_id,provider'
      });

    if (saveError) {
      throw new Error(`Failed to save Procore tokens: ${saveError.message}`);
    }

    // Clear the OAuth state cookie
    res.setHeader('Set-Cookie', 'procore_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

    // Track integration connection event
    try {
      await productAnalytics.trackIntegrationConnected(
        authUser.id,
        authUser.user_metadata?.organization_id || 'unknown',
        'procore',
        'Procore',
        {
          scopes: tokenData.scope,
          expires_in: tokenData.expires_in,
          company_id: userInfo?.company?.id,
          company_name: userInfo?.company?.name,
          base_url: baseUrl,
        }
      );
    } catch (analyticsError) {
      logger.warn('Failed to track Procore integration analytics', {
        operation: 'analytics_tracking',
        endpoint: '/api/auth/procore/callback',
        provider: 'procore',
        userId: user.id,
        error: analyticsError instanceof Error ? analyticsError.message : 'Unknown analytics error'
      });
    }

    // Redirect to integrations page with success message
    res.redirect(302, '/integrations?success=procore_connected');

  } catch (error) {
    logger.error('Procore OAuth callback failed', error, {
      operation: 'oauth_callback',
      endpoint: '/api/auth/procore/callback',
      provider: 'procore'
    });
    
    // Report error to monitoring service
    await reportError(error as Error, {
      endpoint: '/api/auth/procore/callback',
      operation: 'procoreOAuthCallback',
    });

    res.redirect(302, '/integrations?error=procore_connection_failed');
  }
}
