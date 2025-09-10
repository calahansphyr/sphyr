-- User Data Deletion Schema
-- This migration creates functions for secure user data deletion (GDPR compliance)

-- Function to purge all user data across all tables
CREATE OR REPLACE FUNCTION purge_user_data(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  deleted_counts JSONB := '{}';
  table_name TEXT;
  count INTEGER;
  user_exists BOOLEAN;
BEGIN
  -- Verify user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = user_uuid) INTO user_exists;
  
  IF NOT user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found',
      'user_id', user_uuid
    );
  END IF;

  -- Delete in dependency order to respect foreign key constraints
  -- Start with analytics and logs (no dependencies)
  FOR table_name IN (
    'product_analytics_events',
    'search_analytics', 
    'search_results',
    'search_queries',
    'oauth_token_refresh_logs',
    'oauth_authorization_codes',
    'integration_sync_logs'
  ) LOOP
    EXECUTE format('DELETE FROM %I WHERE user_id = $1', table_name) 
    USING user_uuid;
    GET DIAGNOSTICS count = ROW_COUNT;
    deleted_counts := deleted_counts || jsonb_build_object(table_name, count);
  END LOOP;

  -- Delete OAuth tokens (references integrations)
  DELETE FROM oauth_tokens WHERE user_id = user_uuid;
  GET DIAGNOSTICS count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('oauth_tokens', count);

  -- Delete integrations (references users and organizations)
  DELETE FROM integrations WHERE user_id = user_uuid;
  GET DIAGNOSTICS count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('integrations', count);

  -- Delete user sessions
  DELETE FROM user_sessions WHERE user_id = user_uuid;
  GET DIAGNOSTICS count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('user_sessions', count);

  -- Delete user roles
  DELETE FROM user_roles WHERE user_id = user_uuid;
  GET DIAGNOSTICS count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('user_roles', count);

  -- Finally, delete the user record
  DELETE FROM users WHERE id = user_uuid;
  GET DIAGNOSTICS count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('users', count);

  -- Return success response with deletion counts
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_uuid,
    'deleted_at', NOW(),
    'deleted_counts', deleted_counts,
    'message', 'User data successfully purged'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user data summary before deletion
CREATE OR REPLACE FUNCTION get_user_data_summary(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  summary JSONB := '{}';
  count INTEGER;
BEGIN
  -- Verify user exists
  IF NOT EXISTS(SELECT 1 FROM users WHERE id = user_uuid) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found',
      'user_id', user_uuid
    );
  END IF;

  -- Count records in each table
  SELECT COUNT(*) INTO count FROM product_analytics_events WHERE user_id = user_uuid;
  summary := summary || jsonb_build_object('product_analytics_events', count);

  SELECT COUNT(*) INTO count FROM search_analytics WHERE user_id = user_uuid;
  summary := summary || jsonb_build_object('search_analytics', count);

  SELECT COUNT(*) INTO count FROM search_results sr 
  JOIN search_queries sq ON sr.search_query_id = sq.id 
  WHERE sq.user_id = user_uuid;
  summary := summary || jsonb_build_object('search_results', count);

  SELECT COUNT(*) INTO count FROM search_queries WHERE user_id = user_uuid;
  summary := summary || jsonb_build_object('search_queries', count);

  SELECT COUNT(*) INTO count FROM oauth_token_refresh_logs otrl
  JOIN oauth_tokens ot ON otrl.oauth_token_id = ot.id
  WHERE ot.user_id = user_uuid;
  summary := summary || jsonb_build_object('oauth_token_refresh_logs', count);

  SELECT COUNT(*) INTO count FROM oauth_authorization_codes WHERE user_id = user_uuid;
  summary := summary || jsonb_build_object('oauth_authorization_codes', count);

  SELECT COUNT(*) INTO count FROM integration_sync_logs isl
  JOIN integrations i ON isl.integration_id = i.id
  WHERE i.user_id = user_uuid;
  summary := summary || jsonb_build_object('integration_sync_logs', count);

  SELECT COUNT(*) INTO count FROM oauth_tokens WHERE user_id = user_uuid;
  summary := summary || jsonb_build_object('oauth_tokens', count);

  SELECT COUNT(*) INTO count FROM integrations WHERE user_id = user_uuid;
  summary := summary || jsonb_build_object('integrations', count);

  SELECT COUNT(*) INTO count FROM user_sessions WHERE user_id = user_uuid;
  summary := summary || jsonb_build_object('user_sessions', count);

  SELECT COUNT(*) INTO count FROM user_roles WHERE user_id = user_uuid;
  summary := summary || jsonb_build_object('user_roles', count);

  SELECT COUNT(*) INTO count FROM users WHERE id = user_uuid;
  summary := summary || jsonb_build_object('users', count);

  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_uuid,
    'data_summary', summary,
    'total_records', (
      SELECT SUM(value::int) 
      FROM jsonb_each_text(summary) 
      WHERE key != 'users'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to verify user data deletion
CREATE OR REPLACE FUNCTION verify_user_data_deletion(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  remaining_data JSONB := '{}';
  count INTEGER;
BEGIN
  -- Check for any remaining user data
  SELECT COUNT(*) INTO count FROM product_analytics_events WHERE user_id = user_uuid;
  IF count > 0 THEN
    remaining_data := remaining_data || jsonb_build_object('product_analytics_events', count);
  END IF;

  SELECT COUNT(*) INTO count FROM search_analytics WHERE user_id = user_uuid;
  IF count > 0 THEN
    remaining_data := remaining_data || jsonb_build_object('search_analytics', count);
  END IF;

  SELECT COUNT(*) INTO count FROM search_queries WHERE user_id = user_uuid;
  IF count > 0 THEN
    remaining_data := remaining_data || jsonb_build_object('search_queries', count);
  END IF;

  SELECT COUNT(*) INTO count FROM oauth_tokens WHERE user_id = user_uuid;
  IF count > 0 THEN
    remaining_data := remaining_data || jsonb_build_object('oauth_tokens', count);
  END IF;

  SELECT COUNT(*) INTO count FROM integrations WHERE user_id = user_uuid;
  IF count > 0 THEN
    remaining_data := remaining_data || jsonb_build_object('integrations', count);
  END IF;

  SELECT COUNT(*) INTO count FROM user_sessions WHERE user_id = user_uuid;
  IF count > 0 THEN
    remaining_data := remaining_data || jsonb_build_object('user_sessions', count);
  END IF;

  SELECT COUNT(*) INTO count FROM user_roles WHERE user_id = user_uuid;
  IF count > 0 THEN
    remaining_data := remaining_data || jsonb_build_object('user_roles', count);
  END IF;

  SELECT COUNT(*) INTO count FROM users WHERE id = user_uuid;
  IF count > 0 THEN
    remaining_data := remaining_data || jsonb_build_object('users', count);
  END IF;

  RETURN jsonb_build_object(
    'user_id', user_uuid,
    'deletion_complete', jsonb_object_keys(remaining_data) = '[]'::jsonb,
    'remaining_data', remaining_data,
    'verified_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users only
GRANT EXECUTE ON FUNCTION purge_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_data_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_user_data_deletion(UUID) TO authenticated;
