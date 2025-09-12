/**
 * User Account Deletion API Route
 * Securely handles user account deletion with complete data purging
 * Implements GDPR "right to be forgotten" compliance
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { ValidationError, AuthenticationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { productAnalytics } from '@/lib/analytics';
import { validateRequest } from '@/lib/middleware/validation';
import { AccountDeletionSchema } from '@/lib/schemas';

interface DeleteAccountRequest {
  confirmDeletion: boolean;
  reason?: string;
}

interface DeleteAccountResponse {
  success: boolean;
  message: string;
  deletionSummary?: {
    deletedCounts: Record<string, number>;
    deletedAt: string;
  };
  error?: string;
}

async function deleteAccountHandler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteAccountResponse | { error: string }>
) {
  const requestId = `delete_account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.setRequestId(requestId);
  logger.logRequestStart(req.method || 'UNKNOWN', req.url || '/api/user/delete-account');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    logger.warn('Invalid HTTP method for account deletion', { 
      method: req.method, 
      allowedMethods: ['POST'],
      requestId 
    });
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Get authenticated user
    const supabase = createClient(req, res);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      const authError = new AuthenticationError(
        'User not authenticated',
        { error: userError?.message }
      );
      await reportError(authError, { 
        endpoint: '/api/user/delete-account', 
        operation: 'authenticateUser',
        requestId 
      });
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate request body
    const { confirmDeletion, reason } = req.body as DeleteAccountRequest;
    
    if (!confirmDeletion) {
      const validationError = new ValidationError(
        'Account deletion confirmation required',
        'confirmDeletion',
        { confirmDeletion }
      );
      await reportError(validationError, { 
        endpoint: '/api/user/delete-account', 
        operation: 'validateRequest',
        requestId 
      });
      return res.status(400).json({ 
        error: 'Account deletion must be explicitly confirmed' 
      });
    }

    logger.info('User account deletion initiated', {
      userId: user.id,
      userEmail: user.email,
      reason: reason || 'Not provided',
      requestId
    });

    // Get user data summary before deletion
    const { data: summaryData, error: summaryError } = await supabase.rpc('get_user_data_summary', {
      user_uuid: user.id
    });

    if (summaryError) {
      logger.error('Failed to get user data summary', summaryError as Error, {
        userId: user.id,
        requestId
      });
      return res.status(500).json({ 
        error: 'Failed to retrieve user data summary' 
      });
    }

    logger.info('User data summary retrieved', {
      userId: user.id,
      dataSummary: summaryData,
      requestId
    });

    // Track account deletion event before deletion
    try {
      await productAnalytics.trackEvent({
        type: 'error_occurred', // Using error_occurred as closest match
        userId: user.id,
        organizationId: user.user_metadata?.organization_id || 'unknown',
        properties: {
          event_type: 'account_deletion',
          deletion_reason: reason || 'Not provided',
          data_summary: summaryData,
          deletion_initiated_at: new Date().toISOString(),
        }
      });
    } catch (analyticsError) {
      logger.warn('Failed to track account deletion analytics', {
        userId: user.id,
        error: (analyticsError as Error).message,
        requestId
      });
    }

    // Purge all user data
    const { data: deletionResult, error: deletionError } = await supabase.rpc('purge_user_data', {
      user_uuid: user.id
    });

    if (deletionError) {
      logger.error('Failed to purge user data', deletionError as Error, {
        userId: user.id,
        requestId
      });
      return res.status(500).json({ 
        error: 'Failed to delete user account and associated data' 
      });
    }

    if (!deletionResult.success) {
      logger.error('User data purging failed', new Error('User data purging failed'), {
        userId: user.id,
        result: deletionResult,
        requestId
      });
      return res.status(500).json({ 
        error: deletionResult.error || 'Failed to delete user account' 
      });
    }

    // Verify deletion was successful
    const { data: verificationResult, error: verificationError } = await supabase.rpc('verify_user_data_deletion', {
      user_uuid: user.id
    });

    if (verificationError) {
      logger.warn('Failed to verify user data deletion', {
        userId: user.id,
        error: verificationError.message,
        requestId
      });
    } else if (!verificationResult.deletion_complete) {
      logger.error('User data deletion verification failed', new Error('User data deletion verification failed'), {
        userId: user.id,
        remainingData: verificationResult.remaining_data,
        requestId
      });
      return res.status(500).json({ 
        error: 'Account deletion incomplete - some data may remain' 
      });
    }

    // Sign out the user from Supabase Auth
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      logger.warn('Failed to sign out user after deletion', {
        userId: user.id,
        error: (signOutError as Error).message,
        requestId
      });
    }

    logger.info('User account successfully deleted', {
      userId: user.id,
      userEmail: user.email,
      deletionSummary: deletionResult.deleted_counts,
      requestId
    });

    // Return success response
    const response: DeleteAccountResponse = {
      success: true,
      message: 'Account and all associated data have been permanently deleted',
      deletionSummary: {
        deletedCounts: deletionResult.deleted_counts,
        deletedAt: deletionResult.deleted_at,
      }
    };

    logger.logRequestEnd(req.method || 'POST', req.url || '/api/user/delete-account', 200, Date.now(), {
      userId: user.id,
      requestId
    });

    res.status(200).json(response);

  } catch (error) {
    const executionTime = Date.now();
    logger.error('Account deletion API error', error as Error, {
      endpoint: '/api/user/delete-account',
      operation: 'deleteAccount',
      executionTime,
      requestId
    });

    await reportError(error as Error, {
      endpoint: '/api/user/delete-account',
      operation: 'deleteAccount',
      requestId
    });

    res.status(500).json({ 
      error: 'An unexpected error occurred while deleting your account' 
    });
  }
}

// Export handler with validation middleware
export default validateRequest({
  body: AccountDeletionSchema,
  sanitize: true
})(deleteAccountHandler);
