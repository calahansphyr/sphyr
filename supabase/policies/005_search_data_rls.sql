-- Row Level Security Policies for Search Data
-- Ensures users can only access their own search history and results

-- Enable RLS on search_queries table
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own search queries
CREATE POLICY "Users can view their own search queries" ON search_queries
    FOR SELECT USING (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Users can create their own search queries
CREATE POLICY "Users can create their own search queries" ON search_queries
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Users can update their own search queries
CREATE POLICY "Users can update their own search queries" ON search_queries
    FOR UPDATE USING (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Users can delete their own search queries
CREATE POLICY "Users can delete their own search queries" ON search_queries
    FOR DELETE USING (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Admins can view all search queries in their organization (for analytics)
CREATE POLICY "Admins can view organization search queries" ON search_queries
    FOR SELECT USING (
        organization_id = get_user_organization(auth.uid()) 
        AND is_user_admin(auth.uid())
    );

-- Enable RLS on search_results table
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view search results for their own queries
CREATE POLICY "Users can view their own search results" ON search_results
    FOR SELECT USING (
        search_query_id IN (
            SELECT id FROM search_queries 
            WHERE user_id = auth.uid() 
            AND organization_id = get_user_organization(auth.uid())
        )
    );

-- Policy: System can create search results
CREATE POLICY "System can create search results" ON search_results
    FOR INSERT WITH CHECK (true);

-- Policy: Users can delete search results for their own queries
CREATE POLICY "Users can delete their own search results" ON search_results
    FOR DELETE USING (
        search_query_id IN (
            SELECT id FROM search_queries 
            WHERE user_id = auth.uid() 
            AND organization_id = get_user_organization(auth.uid())
        )
    );

-- Enable RLS on search_analytics table
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view analytics for their own searches
CREATE POLICY "Users can view their own search analytics" ON search_analytics
    FOR SELECT USING (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: System can create search analytics
CREATE POLICY "System can create search analytics" ON search_analytics
    FOR INSERT WITH CHECK (true);

-- Policy: Users can update analytics for their own searches
CREATE POLICY "Users can update their own search analytics" ON search_analytics
    FOR UPDATE USING (
        user_id = auth.uid() 
        AND organization_id = get_user_organization(auth.uid())
    );

-- Policy: Admins can view all analytics in their organization
CREATE POLICY "Admins can view organization analytics" ON search_analytics
    FOR SELECT USING (
        organization_id = get_user_organization(auth.uid()) 
        AND is_user_admin(auth.uid())
    );
