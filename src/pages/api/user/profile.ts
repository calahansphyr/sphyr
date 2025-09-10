import type { NextApiRequest, NextApiResponse } from 'next';
import { UserProfile } from '@/types/user';
import { UserProfileUpdateSchema, createErrorResponse, createSuccessResponse } from '@/lib/schemas';
import { ValidationError, AuthenticationError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    if (req.method === 'GET') {
      // Get user profile
      const supabase = createClient(req, res);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        const authError = new AuthenticationError(
          'User must be authenticated to access profile',
          { userError: userError?.message }
        );
        await reportError(authError, { endpoint: '/api/user/profile', operation: 'getUser' });
        res.status(401).json(createErrorResponse(
          'Authentication required',
          'AUTHENTICATION_REQUIRED'
        ));
        return;
      }

      // Mock user profile data (in production, fetch from database)
      const userProfile: UserProfile = {
        id: user.id,
        name: user.user_metadata?.name || 'User',
        email: user.email || '',
      };

      res.status(200).json(userProfile);

    } else if (req.method === 'PUT') {
      // Update user profile
      const supabase = createClient(req, res);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        const authError = new AuthenticationError(
          'User must be authenticated to update profile',
          { userError: userError?.message }
        );
        await reportError(authError, { endpoint: '/api/user/profile', operation: 'getUser' });
        res.status(401).json(createErrorResponse(
          'Authentication required',
          'AUTHENTICATION_REQUIRED'
        ));
        return;
      }

      // Validate request body
      const validationResult = UserProfileUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = new ValidationError(
          'Invalid profile update data',
          'requestBody',
          req.body,
          { validationErrors: validationResult.error.issues }
        );
        await reportError(validationError, { endpoint: '/api/user/profile', operation: 'validateUpdate' });
        res.status(400).json(createErrorResponse(
          'Invalid profile update data',
          'VALIDATION_ERROR',
          validationResult.error.issues
        ));
        return;
      }

      const updateData = validationResult.data;

      // Update user metadata in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: updateData.name,
          preferences: updateData.preferences,
        }
      });

      if (updateError) {
        await reportError(updateError, { 
          endpoint: '/api/user/profile', 
          operation: 'updateProfile',
          userId: user.id 
        });
        res.status(500).json(createErrorResponse(
          'Failed to update profile',
          'UPDATE_ERROR'
        ));
        return;
      }

      res.status(200).json(createSuccessResponse(
        'Profile updated successfully',
        { id: user.id, ...updateData }
      ));

    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).json(createErrorResponse(
        `Method ${req.method} Not Allowed`,
        'METHOD_NOT_ALLOWED'
      ));
    }

  } catch (error) {
    logger.error('User profile API error', error as Error, {
      endpoint: '/api/user/profile',
      operation: 'handleRequest',
    });
    
    await reportError(error as Error, {
      endpoint: '/api/user/profile',
      operation: 'handleRequest',
    });

    res.status(500).json(createErrorResponse(
      'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR'
    ));
  }
}
