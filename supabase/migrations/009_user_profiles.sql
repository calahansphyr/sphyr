-- User Profiles Migration
-- Creates user_profiles table for storing user-specific data
-- Follows DRY principles by reusing existing patterns from other migrations

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one profile per user
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own profile
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policy: Users can view other profiles in their organization (for collaboration features)
CREATE POLICY "Users can view organization profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = (
        SELECT organization_id FROM users WHERE users.id = user_profiles.user_id
      )
    )
  );

-- Create updated_at trigger (following DRY principle from existing migrations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'User profile information and preferences';
COMMENT ON COLUMN user_profiles.user_id IS 'Reference to auth.users.id';
COMMENT ON COLUMN user_profiles.preferences IS 'User preferences stored as JSONB';
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL to user avatar image';
