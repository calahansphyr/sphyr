-- Search history schema
-- This migration creates tables for tracking user search history and analytics

-- Search queries table
CREATE TABLE search_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    processed_query TEXT,
    filters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search results table
CREATE TABLE search_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_query_id UUID REFERENCES search_queries(id) ON DELETE CASCADE,
    integration_type integration_type NOT NULL,
    result_data JSONB NOT NULL,
    relevance_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search analytics table
CREATE TABLE search_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_query_id UUID REFERENCES search_queries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    result_clicked BOOLEAN DEFAULT FALSE,
    result_clicked_id UUID REFERENCES search_results(id),
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX idx_search_queries_organization_id ON search_queries(organization_id);
CREATE INDEX idx_search_queries_created_at ON search_queries(created_at);
CREATE INDEX idx_search_results_search_query_id ON search_results(search_query_id);
CREATE INDEX idx_search_results_integration_type ON search_results(integration_type);
CREATE INDEX idx_search_analytics_search_query_id ON search_analytics(search_query_id);
CREATE INDEX idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX idx_search_analytics_organization_id ON search_analytics(organization_id);

-- Create a function to clean up old search data (for privacy and performance)
CREATE OR REPLACE FUNCTION cleanup_old_search_data()
RETURNS void AS $$
BEGIN
    -- Delete search data older than 90 days
    DELETE FROM search_analytics 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM search_results 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM search_queries 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
