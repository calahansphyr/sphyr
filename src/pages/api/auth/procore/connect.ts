/**
 * Procore OAuth Connect API Route
 * Initiates the OAuth 2.0 flow for Procore integration
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
    const clientId = process.env.PROCORE_CLIENT_ID;
    const clientSecret = process.env.PROCORE_CLIENT_SECRET;
    const baseUrl = process.env.PROCORE_BASE_URL || 'https://api.procore.com';
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      const validationError = new ValidationError(
        'Missing required Procore OAuth environment variables',
        'environment',
        { clientId: !!clientId, clientSecret: !!clientSecret, redirectUri: !!redirectUri }
      );
      await reportError(validationError, { endpoint: '/api/auth/procore/connect', operation: 'validateEnvironment' });
      return res.status(500).json(createErrorResponse(
        'Procore integration not configured',
        'PROCORE_CONFIG_ERROR'
      ));
    }

    // Generate state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    
    // Build Procore OAuth authorization URL
    const authUrl = new URL('/oauth/authorize', baseUrl);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', `${redirectUri}/api/auth/procore/callback`);
    authUrl.searchParams.set('scope', 'read:project read:document read:rfi');
    authUrl.searchParams.set('state', state);

    // Store state in session/cookie for validation in callback
    res.setHeader('Set-Cookie', `procore_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

    // Redirect to Procore OAuth
    res.redirect(302, authUrl.toString());

  } catch (error) {
    console.error('Procore OAuth connect error:', error);
    
    // Report error to monitoring service
    await reportError(error as Error, {
      endpoint: '/api/auth/procore/connect',
      operation: 'procoreOAuthConnect',
    });

    res.status(500).json(createErrorResponse(
      'Failed to initiate Procore OAuth flow',
      'PROCORE_OAUTH_ERROR'
    ));
  }
}
