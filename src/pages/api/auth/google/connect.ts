/**
 * Google OAuth Connect API Route
 * Initiates the OAuth 2.0 flow to connect user's Google account
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
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
    return res.status(405).json(createErrorResponse(
      `Method ${req.method} Not Allowed`,
      'METHOD_NOT_ALLOWED',
      { allowedMethods: ['GET'] }
    ));
  }

  try {
    // Validate environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      const validationError = new ValidationError(
        'Google OAuth configuration is missing. Please check environment variables.',
        'oauth_config',
        { clientId: !!clientId, clientSecret: !!clientSecret, baseUrl: !!baseUrl }
      );
      await reportError(validationError, { endpoint: '/api/auth/google/connect', operation: 'validateConfig' });
      return res.status(500).json(createErrorResponse(
        'OAuth configuration is incomplete',
        'OAUTH_CONFIG_ERROR'
      ));
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${baseUrl}/api/auth/google/callback`
    );

    // Define the scopes we need
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    // Generate the authentication URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      scope: scopes,
      prompt: 'consent', // Force consent screen to ensure refresh token
      include_granted_scopes: true,
    });

    logger.info('Generated Google OAuth URL', {
      operation: 'generateAuthUrl',
      endpoint: '/api/auth/google/connect',
      authUrl: authUrl.substring(0, 100) + '...' // Log partial URL for security
    });

    // Redirect user to Google's OAuth consent screen
    res.redirect(302, authUrl);

  } catch (error) {
    logger.error('Google OAuth connect error', error as Error, {
      operation: 'generateAuthUrl',
      endpoint: '/api/auth/google/connect'
    });
    
    // Report error to monitoring service
    await reportError(error as Error, {
      endpoint: '/api/auth/google/connect',
      operation: 'generateAuthUrl',
    });

    res.status(500).json(createErrorResponse(
      'Failed to initiate Google OAuth flow. Please try again.',
      'OAUTH_INIT_ERROR'
    ));
  }
}
