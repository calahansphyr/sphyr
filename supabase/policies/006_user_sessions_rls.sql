-- Row Level Security Policies for User Sessions
-- Ensures users can only access their own session data

-- Enable RLS on user_sessions table
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Policy: System can create user sessions
CREATE POLICY "System can create user sessions" ON user_sessions
    FOR INSERT WITH CHECK (true);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions" ON user_sessions
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- Policy: System can delete expired sessions
CREATE POLICY "System can delete expired sessions" ON user_sessions
    FOR DELETE USING (expires_at < NOW());
