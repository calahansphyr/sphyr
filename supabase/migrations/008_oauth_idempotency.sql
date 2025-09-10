-- OAuth Callback Idempotency Schema
-- This migration adds idempotency support to OAuth callbacks to prevent duplicate processing

-- Add authorization_code column to oauth_tokens table
ALTER TABLE oauth_tokens 
ADD COLUMN authorization_code TEXT;

-- Add unique constraint to prevent duplicate authorization codes
ALTER TABLE oauth_tokens 
ADD CONSTRAINT unique_authorization_code UNIQUE (authorization_code);

-- Create index for efficient lookups
CREATE INDEX idx_oauth_tokens_authorization_code ON oauth_tokens(authorization_code);

-- Create a function to check if authorization code has been used
CREATE OR REPLACE FUNCTION is_authorization_code_used(auth_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM oauth_tokens 
    WHERE authorization_code = auth_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get existing token by authorization code
CREATE OR REPLACE FUNCTION get_token_by_authorization_code(auth_code TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  organization_id UUID,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ot.id,
    ot.user_id,
    ot.organization_id,
    ot.provider,
    ot.created_at
  FROM oauth_tokens ot
  WHERE ot.authorization_code = auth_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to store authorization code with token
CREATE OR REPLACE FUNCTION store_oauth_token_with_code(
  user_uuid UUID,
  org_uuid UUID,
  provider_name TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT DEFAULT NULL,
  token_type_param TEXT DEFAULT 'Bearer',
  expires_at_param TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  scope_param TEXT DEFAULT NULL,
  auth_code TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  token_id UUID;
BEGIN
  INSERT INTO oauth_tokens (
    user_id,
    organization_id,
    provider,
    access_token_encrypted,
    refresh_token_encrypted,
    token_type,
    expires_at,
    scope,
    authorization_code,
    created_at,
    updated_at
  ) VALUES (
    user_uuid,
    org_uuid,
    provider_name,
    access_token_encrypted,
    refresh_token_encrypted,
    token_type_param,
    expires_at_param,
    scope_param,
    auth_code,
    NOW(),
    NOW()
  ) RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION is_authorization_code_used(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_token_by_authorization_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION store_oauth_token_with_code(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT) TO authenticated;
