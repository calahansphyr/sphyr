import type { NextApiRequest, NextApiResponse } from 'next';
import { UserProfile } from '@/types/user';
import { UserProfileUpdateSchema, createErrorResponse, createSuccessResponse } from '@/lib/schemas';
import { ValidationError, AuthenticationError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { validateRequest } from '@/lib/middleware/validation';

async function profileHandler(
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

      // Fetch user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is acceptable for new users
        await reportError(profileError, { 
          endpoint: '/api/user/profile', 
          operation: 'getProfile',
          userId: user.id 
        });
        res.status(500).json(createErrorResponse(
          'Failed to fetch profile',
          'PROFILE_FETCH_ERROR'
        ));
        return;
      }

      // Use database profile or create fallback from auth data
      const userProfile: UserProfile = profile || {
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

      // Update user profile in database (upsert to handle new users)
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          name: updateData.name,
          email: user.email,
          preferences: updateData.preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

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

      // Also update auth metadata for consistency
      await supabase.auth.updateUser({
        data: {
          name: updateData.name,
        }
      });

      res.status(200).json(createSuccessResponse(
        'Profile updated successfully',
        updatedProfile
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

// Export handler with validation middleware
export default validateRequest({
  body: UserProfileUpdateSchema.optional(),
  sanitize: true
})(profileHandler);
