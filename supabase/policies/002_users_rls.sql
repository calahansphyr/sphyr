-- Row Level Security Policies for Users
-- Ensures users can only access users within their organization

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view other users in their organization
CREATE POLICY "Users can view organization members" ON users
    FOR SELECT USING (
        organization_id = get_user_organization(auth.uid())
    );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (
        id = auth.uid()
    );

-- Policy: Only admins can create new users in their organization
CREATE POLICY "Admins can create organization users" ON users
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization(auth.uid()) 
        AND is_user_admin(auth.uid())
    );

-- Policy: Only admins can delete users in their organization
CREATE POLICY "Admins can delete organization users" ON users
    FOR DELETE USING (
        organization_id = get_user_organization(auth.uid()) 
        AND is_user_admin(auth.uid())
        AND id != auth.uid() -- Prevent self-deletion
    );

-- Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view roles in their organization
CREATE POLICY "Users can view organization roles" ON user_roles
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE organization_id = get_user_organization(auth.uid())
        )
    );

-- Policy: Only admins can manage roles in their organization
CREATE POLICY "Admins can manage organization roles" ON user_roles
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users 
            WHERE organization_id = get_user_organization(auth.uid())
        ) AND is_user_admin(auth.uid())
    );
