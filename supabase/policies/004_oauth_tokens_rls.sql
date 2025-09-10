-- Row Level Security Policies for OAuth Tokens
-- Ensures users can only access their own OAuth tokens

-- Enable RLS on oauth_tokens table
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own OAuth tokens
CREATE POLICY "Users can view their own tokens" ON oauth_tokens
    FOR SELECT USING (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Users can update their own OAuth tokens
CREATE POLICY "Users can update their own tokens" ON oauth_tokens
    FOR UPDATE USING (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Users can create OAuth tokens for themselves
CREATE POLICY "Users can create their own tokens" ON oauth_tokens
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Users can delete their own OAuth tokens
CREATE POLICY "Users can delete their own tokens" ON oauth_tokens
    FOR DELETE USING (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Admins can view all OAuth tokens in their organization (for debugging)
CREATE POLICY "Admins can view organization tokens" ON oauth_tokens
    FOR SELECT USING (
        organization_id = get_user_organization(auth.uid()) 
        AND is_user_admin(auth.uid())
    );

-- Enable RLS on oauth_authorization_codes table
ALTER TABLE oauth_authorization_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own authorization codes
CREATE POLICY "Users can view their own auth codes" ON oauth_authorization_codes
    FOR SELECT USING (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: System can create authorization codes
CREATE POLICY "System can create auth codes" ON oauth_authorization_codes
    FOR INSERT WITH CHECK (true);

-- Policy: System can delete expired authorization codes
CREATE POLICY "System can delete expired auth codes" ON oauth_authorization_codes
    FOR DELETE USING (expires_at < NOW());

-- Enable RLS on oauth_token_refresh_logs table
ALTER TABLE oauth_token_refresh_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view refresh logs for their own tokens
CREATE POLICY "Users can view their own refresh logs" ON oauth_token_refresh_logs
    FOR SELECT USING (
        oauth_token_id IN (
            SELECT id FROM oauth_tokens 
            WHERE user_id = auth.uid() 
            AND organization_id = get_user_organization(auth.uid())
        )
    );

-- Policy: System can insert refresh logs
CREATE POLICY "System can insert refresh logs" ON oauth_token_refresh_logs
    FOR INSERT WITH CHECK (true);
