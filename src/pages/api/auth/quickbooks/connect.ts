/**
 * QuickBooks OAuth Connect API Route
 * Initiates the OAuth 2.0 flow for QuickBooks integration
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
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      const validationError = new ValidationError(
        'Missing required QuickBooks OAuth environment variables',
        'environment',
        { clientId: !!clientId, clientSecret: !!clientSecret, baseUrl: !!baseUrl }
      );
      await reportError(validationError, { endpoint: '/api/auth/quickbooks/connect', operation: 'validateEnvironment' });
      return res.status(500).json(createErrorResponse(
        'QuickBooks integration not configured',
        'QUICKBOOKS_CONFIG_ERROR'
      ));
    }

    // Define the scopes we need for QuickBooks
    const scopes = [
      'com.intuit.quickbooks.accounting', // Read accounting data
      'com.intuit.quickbooks.payment',    // Read payment data
    ];

    // Build the OAuth URL
    const redirectUri = `${baseUrl}/api/auth/quickbooks/callback`;
    const state = Math.random().toString(36).substring(2, 15); // Generate random state for security
    
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('state', state);

    // Store state in session/cookie for validation in callback
    res.setHeader('Set-Cookie', `quickbooks_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

    // Redirect to QuickBooks OAuth
    res.redirect(302, authUrl.toString());

  } catch (error) {
    console.error('QuickBooks OAuth connect error:', error);
    
    // Report error to monitoring service
    await reportError(error as Error, {
      endpoint: '/api/auth/quickbooks/connect',
      operation: 'quickbooksOAuthConnect',
    });

    res.status(500).json(createErrorResponse(
      'Failed to initiate QuickBooks OAuth flow',
      'QUICKBOOKS_OAUTH_ERROR'
    ));
  }
}
