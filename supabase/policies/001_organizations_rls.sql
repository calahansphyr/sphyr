-- Row Level Security Policies for Organizations
-- Ensures users can only access their own organization's data

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own organization
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id = get_user_organization(auth.uid())
    );

-- Policy: Only admins can update their organization
CREATE POLICY "Admins can update their organization" ON organizations
    FOR UPDATE USING (
        id = get_user_organization(auth.uid()) 
        AND is_user_admin(auth.uid())
    );

-- Policy: Only admins can insert new organizations (for multi-org scenarios)
CREATE POLICY "Admins can create organizations" ON organizations
    FOR INSERT WITH CHECK (
        is_user_admin(auth.uid())
    );

-- Policy: Only admins can delete their organization
CREATE POLICY "Admins can delete their organization" ON organizations
    FOR DELETE USING (
        id = get_user_organization(auth.uid()) 
        AND is_user_admin(auth.uid())
    );
