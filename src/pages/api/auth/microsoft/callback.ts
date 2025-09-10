/**
 * Microsoft OAuth Callback API Route
 * Handles the OAuth 2.0 callback from Microsoft
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
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
      await reportError(validationError, { endpoint: '/api/auth/microsoft/callback', operation: 'validateCallback' });
      return res.redirect(302, '/integrations?error=invalid_callback');
    }

    const { code, state, error } = validationResult.data;

    // Create Supabase client
    const supabase = createClient(req, res);

    // Check for OAuth error
    if (error) {
      const authError = new AuthenticationError(
        `Microsoft OAuth error: ${error}`,
        { error, state }
      );
      await reportError(authError, { endpoint: '/api/auth/microsoft/callback', operation: 'microsoftOAuthError' });
      return res.redirect(302, '/integrations?error=microsoft_oauth_failed');
    }

    // Validate required parameters
    if (!code || !state) {
      const validationError = new ValidationError(
        'Missing required OAuth parameters',
        'query',
        { code: !!code, state: !!state }
      );
      await reportError(validationError, { endpoint: '/api/auth/microsoft/callback', operation: 'validateOAuthParams' });
      return res.redirect(302, '/integrations?error=invalid_oauth_response');
    }

    // Check if authorization code has already been used (idempotency)
    const { data: codeUsed, error: codeCheckError } = await supabase.rpc('is_authorization_code_used', {
      auth_code: code
    });

    if (codeCheckError) {
      logger.warn('Failed to check authorization code usage', {
        operation: 'check_authorization_code',
        endpoint: '/api/auth/microsoft/callback',
        provider: 'microsoft',
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
          endpoint: '/api/auth/microsoft/callback',
          provider: 'microsoft',
          error: tokenError.message
        });
      } else if (existingToken && existingToken.length > 0) {
        logger.info('Authorization code already used, redirecting to success', {
          operation: 'duplicate_authorization_code',
          endpoint: '/api/auth/microsoft/callback',
          provider: 'microsoft',
          tokenId: existingToken[0].id,
          userId: existingToken[0].user_id,
          createdAt: existingToken[0].created_at
        });
      }

      // Redirect to success page without processing again
      return res.redirect(302, '/integrations?success=microsoft_connected&message=already_connected');
    }

    // Validate state parameter (CSRF protection)
    const cookieState = req.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('microsoft_oauth_state='))
      ?.split('=')[1];

    if (state !== cookieState) {
      const authError = new AuthenticationError(
        'Invalid OAuth state parameter',
        { receivedState: state, expectedState: cookieState }
      );
      await reportError(authError, { endpoint: '/api/auth/microsoft/callback', operation: 'validateOAuthState' });
      return res.redirect(302, '/integrations?error=invalid_state');
    }

    // Get current user session
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

    if (userError || !authUser) {
      const authError = new AuthenticationError(
        'User must be authenticated to connect Microsoft account',
        { userError: userError?.message }
      );
      await reportError(authError, { endpoint: '/api/auth/microsoft/callback', operation: 'getUser' });
      return res.redirect(302, '/login?redirect=/integrations');
    }

    // Initialize MSAL application for token exchange
    const msalApp = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
      },
    });

    // Exchange code for tokens
    const tokenRequest = {
      code: code as string,
      scopes: [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Files.Read.All',
        'https://graph.microsoft.com/Calendars.Read',
        'https://graph.microsoft.com/User.Read',
        'https://graph.microsoft.com/offline_access',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/microsoft/callback`,
    };

    const tokenResponse = await msalApp.acquireTokenByCode(tokenRequest);

    if (!tokenResponse.accessToken) {
      throw new Error('Failed to obtain access token from Microsoft');
    }

    // Get user information to extract tenant ID
    const graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => tokenResponse.accessToken,
      },
    });

    let tenantId = 'common';
    try {
      const userInfo = await graphClient.api('/me').select('id,userPrincipalName').get();
      // Extract tenant ID from userPrincipalName (format: user@tenant.onmicrosoft.com)
      const userPrincipalName = userInfo.userPrincipalName;
      if (userPrincipalName && userPrincipalName.includes('@')) {
        const domain = userPrincipalName.split('@')[1];
        if (domain.includes('.')) {
          tenantId = domain.split('.')[0];
        }
      }
    } catch (error) {
      logger.warn('Failed to extract tenant ID from user info', {
        operation: 'extract_tenant_id',
        endpoint: '/api/auth/microsoft/callback',
        provider: 'microsoft',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Continue with default tenant ID
    }

    // Save tokens to Supabase with authorization code
    const { error: saveError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: authUser.id,
        organization_id: authUser.user_metadata?.organization_id || null,
        provider: 'microsoft',
        access_token_encrypted: tokenResponse.accessToken,
        refresh_token_encrypted: tokenResponse.refreshOn || null,
        expires_at: tokenResponse.expiresOn ? new Date(tokenResponse.expiresOn.getTime()).toISOString() : null,
        scope: tokenResponse.scopes?.join(' ') || 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Files.Read.All https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/User.Read',
        authorization_code: code,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Store tenant ID in metadata for Microsoft Graph
        metadata: JSON.stringify({ tenantId }),
      }, {
        onConflict: 'user_id,provider'
      });

    if (saveError) {
      throw new Error(`Failed to save Microsoft tokens: ${saveError.message}`);
    }

    // Clear the OAuth state cookie
    res.setHeader('Set-Cookie', 'microsoft_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

    // Track integration connection event
    try {
      await productAnalytics.trackIntegrationConnected(
        authUser.id,
        authUser.user_metadata?.organization_id || 'unknown',
        'microsoft',
        'Microsoft 365',
        {
          scopes: Array.isArray(tokenResponse.scopes) ? tokenResponse.scopes.join(',') : (tokenResponse.scopes || 'unknown'),
          tenant_id: tenantId,
          services: 'outlook,onedrive,calendar,word,excel',
        }
      );
    } catch (analyticsError) {
      logger.warn('Failed to track Microsoft integration analytics', {
        operation: 'analytics_tracking',
        endpoint: '/api/auth/microsoft/callback',
        provider: 'microsoft',
        userId: user.id,
        error: analyticsError instanceof Error ? analyticsError.message : 'Unknown analytics error'
      });
    }

    // Redirect to integrations page with success message
    res.redirect(302, '/integrations?success=microsoft_connected');

  } catch (error) {
    logger.error('Microsoft OAuth callback failed', error, {
      operation: 'oauth_callback',
      endpoint: '/api/auth/microsoft/callback',
      provider: 'microsoft'
    });
    
    // Report error to monitoring service
    await reportError(error as Error, {
      endpoint: '/api/auth/microsoft/callback',
      operation: 'microsoftOAuthCallback',
    });

    res.redirect(302, '/integrations?error=microsoft_connection_failed');
  }
}
