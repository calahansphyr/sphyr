/**
 * Asana OAuth Connect API Route
 * Initiates the OAuth 2.0 flow for Asana integration
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { reportError } from '@/lib/monitoring';
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
    const clientId = process.env.ASANA_CLIENT_ID;
    const clientSecret = process.env.ASANA_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      const validationError = new ValidationError(
        'Missing required Asana OAuth environment variables',
        'environment',
        { clientId: !!clientId, clientSecret: !!clientSecret, baseUrl: !!baseUrl }
      );
      await reportError(validationError, { endpoint: '/api/auth/asana/connect', operation: 'validateEnvironment' });
      return res.status(500).json(createErrorResponse(
        'Asana integration not configured',
        'ASANA_CONFIG_ERROR'
      ));
    }

    // Define the scopes we need for Asana
    const scopes = [
      'default', // Basic read access to user's tasks and projects
    ];

    // Build the OAuth URL
    const redirectUri = `${baseUrl}/api/auth/asana/callback`;
    const state = Math.random().toString(36).substring(2, 15); // Generate random state for security
    
    const authUrl = new URL('https://app.asana.com/-/oauth_authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', scopes.join(' '));

    // Store state in session/cookie for validation in callback
    res.setHeader('Set-Cookie', `asana_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

    // Redirect to Asana OAuth
    res.redirect(302, authUrl.toString());

  } catch (error) {
    console.error('Asana OAuth connect error:', error);
    
    // Report error to monitoring service
    await reportError(error as Error, {
      endpoint: '/api/auth/asana/connect',
      operation: 'asanaOAuthConnect',
    });

    res.status(500).json(createErrorResponse(
      'Failed to initiate Asana OAuth flow',
      'ASANA_OAUTH_ERROR'
    ));
  }
}
