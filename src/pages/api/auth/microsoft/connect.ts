/**
 * Microsoft OAuth Connect API Route
 * Initiates the OAuth 2.0 flow for Microsoft 365 integration
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { reportError } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';
import { createErrorResponse } from '@/lib/schemas';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Validate environment variables
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      const validationError = new ValidationError(
        'Missing required Microsoft OAuth environment variables',
        'environment',
        { clientId: !!clientId, clientSecret: !!clientSecret, baseUrl: !!baseUrl }
      );
      await reportError(validationError, { endpoint: '/api/auth/microsoft/connect', operation: 'validateEnvironment' });
      return res.status(500).json(createErrorResponse(
        'Microsoft integration not configured',
        'MICROSOFT_CONFIG_ERROR'
      ));
    }

    // Define the scopes we need for Microsoft Graph
    const scopes = [
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Files.Read.All',
      'https://graph.microsoft.com/Calendars.Read',
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/offline_access',
    ];

    // Initialize MSAL application
    const msalApp = new ConfidentialClientApplication({
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    });

    // Generate state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    
    // Get authorization URL
    const authUrlParameters = {
      scopes,
      redirectUri: `${baseUrl}/api/auth/microsoft/callback`,
      state,
      prompt: 'select_account', // Force account selection
    };

    const authUrl = await msalApp.getAuthCodeUrl(authUrlParameters);

    // Store state in session/cookie for validation in callback
    res.setHeader('Set-Cookie', `microsoft_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

    // Redirect to Microsoft OAuth
    res.redirect(302, authUrl);

  } catch (error) {
    logger.error('Microsoft OAuth connect error', error as Error, {
      operation: 'generateAuthUrl',
      endpoint: '/api/auth/microsoft/connect'
    });
    
    // Report error to monitoring service
    await reportError(error as Error, {
      endpoint: '/api/auth/microsoft/connect',
      operation: 'microsoftOAuthConnect',
    });

    res.status(500).json(createErrorResponse(
      'Failed to initiate Microsoft OAuth flow',
      'MICROSOFT_OAUTH_ERROR'
    ));
  }
}
