-- Row Level Security Policies for Integrations
-- Ensures users can only access integrations within their organization

-- Enable RLS on integrations table
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view integrations in their organization
CREATE POLICY "Users can view organization integrations" ON integrations
    FOR SELECT USING (
        organization_id = get_user_organization(auth.uid())
    );

-- Policy: Users can update their own integrations
CREATE POLICY "Users can update their own integrations" ON integrations
    FOR UPDATE USING (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Users can create integrations for themselves
CREATE POLICY "Users can create their own integrations" ON integrations
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Users can delete their own integrations
CREATE POLICY "Users can delete their own integrations" ON integrations
    FOR DELETE USING (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Admins can manage all integrations in their organization
CREATE POLICY "Admins can manage organization integrations" ON integrations
    FOR ALL USING (
        organization_id = get_user_organization(auth.uid()) 
        AND is_user_admin(auth.uid())
    );

-- Enable RLS on integration_sync_logs table
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sync logs for integrations in their organization
CREATE POLICY "Users can view organization sync logs" ON integration_sync_logs
    FOR SELECT USING (
        integration_id IN (
            SELECT id FROM integrations 
            WHERE organization_id = get_user_organization(auth.uid())
        )
    );

-- Policy: System can insert sync logs (for automated processes)
CREATE POLICY "System can insert sync logs" ON integration_sync_logs
    FOR INSERT WITH CHECK (true);

-- Policy: Only admins can delete sync logs
CREATE POLICY "Admins can delete sync logs" ON integration_sync_logs
    FOR DELETE USING (
        integration_id IN (
            SELECT id FROM integrations 
            WHERE organization_id = get_user_organization(auth.uid())
        ) AND is_user_admin(auth.uid())
    );
