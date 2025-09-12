/**
 * Slack OAuth Connect API Route
 * Initiates the OAuth 2.0 flow for Slack integration
 */

import type { NextApiRequest, NextApiResponse } from 'next';
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
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      const validationError = new ValidationError(
        'Missing required Slack OAuth environment variables',
        'environment',
        { clientId: !!clientId, clientSecret: !!clientSecret, baseUrl: !!baseUrl }
      );
      await reportError(validationError, { endpoint: '/api/auth/slack/connect', operation: 'validateEnvironment' });
      return res.status(500).json(createErrorResponse(
        'Slack integration not configured',
        'SLACK_CONFIG_ERROR'
      ));
    }

    // Define the scopes we need for Slack
    const scopes = [
      'search:read',        // Read search results
      'channels:read',      // Read public channel information
      'groups:read',        // Read private channel information
      'im:read',           // Read direct messages
      'mpim:read',         // Read group direct messages
      'users:read',        // Read user information
      'team:read',         // Read team information
    ];

    // Build the OAuth URL
    const redirectUri = `${baseUrl}/api/auth/slack/callback`;
    const state = Math.random().toString(36).substring(2, 15); // Generate random state for security
    
    const authUrl = new URL('https://slack.com/oauth/v2/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('scope', scopes.join(','));
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');

    // Store state in session/cookie for validation in callback
    res.setHeader('Set-Cookie', `slack_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

    // Redirect to Slack OAuth
    res.redirect(302, authUrl.toString());

  } catch (error) {
    logger.error('Slack OAuth connect error', error as Error, {
      operation: 'generateAuthUrl',
      endpoint: '/api/auth/slack/connect'
    });
    
    // Report error to monitoring service
    await reportError(error as Error, {
      endpoint: '/api/auth/slack/connect',
      operation: 'slackOAuthConnect',
    });

    res.status(500).json(createErrorResponse(
      'Failed to initiate Slack OAuth flow',
      'SLACK_OAUTH_ERROR'
    ));
  }
}
