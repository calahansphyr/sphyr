-- OAuth tokens schema
-- This migration creates tables for securely storing OAuth tokens and managing authentication

-- OAuth tokens table
CREATE TABLE oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth authorization codes table (for temporary storage during OAuth flow)
CREATE TABLE oauth_authorization_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(255) UNIQUE NOT NULL,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    state VARCHAR(255),
    redirect_uri TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth token refresh logs table
CREATE TABLE oauth_token_refresh_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oauth_token_id UUID REFERENCES oauth_tokens(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_oauth_tokens_integration_id ON oauth_tokens(integration_id);
CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_organization_id ON oauth_tokens(organization_id);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX idx_oauth_authorization_codes_code ON oauth_authorization_codes(code);
CREATE INDEX idx_oauth_authorization_codes_expires_at ON oauth_authorization_codes(expires_at);
CREATE INDEX idx_oauth_token_refresh_logs_oauth_token_id ON oauth_token_refresh_logs(oauth_token_id);

-- Add updated_at trigger
CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to clean up expired authorization codes
CREATE OR REPLACE FUNCTION cleanup_expired_authorization_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_authorization_codes 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a function to refresh expired tokens
CREATE OR REPLACE FUNCTION get_expired_tokens()
RETURNS TABLE (
    id UUID,
    integration_id UUID,
    refresh_token_encrypted TEXT,
    user_id UUID,
    organization_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ot.id,
        ot.integration_id,
        ot.refresh_token_encrypted,
        ot.user_id,
        ot.organization_id
    FROM oauth_tokens ot
    WHERE ot.expires_at < NOW() + INTERVAL '5 minutes'
    AND ot.refresh_token_encrypted IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
