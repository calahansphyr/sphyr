-- Product Analytics Events Schema
-- This migration creates tables for tracking business events and product analytics

-- Product analytics events table
CREATE TABLE product_analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_product_analytics_events_event_type ON product_analytics_events(event_type);
CREATE INDEX idx_product_analytics_events_user_id ON product_analytics_events(user_id);
CREATE INDEX idx_product_analytics_events_organization_id ON product_analytics_events(organization_id);
CREATE INDEX idx_product_analytics_events_created_at ON product_analytics_events(created_at);

-- Create composite index for common queries
CREATE INDEX idx_product_analytics_events_org_type_date ON product_analytics_events(organization_id, event_type, created_at DESC);

-- Create a function to get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary(
    org_id UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    event_type VARCHAR(100),
    event_count BIGINT,
    unique_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pae.event_type,
        COUNT(*) as event_count,
        COUNT(DISTINCT pae.user_id) as unique_users
    FROM product_analytics_events pae
    WHERE pae.organization_id = org_id
    AND pae.created_at BETWEEN start_date AND end_date
    GROUP BY pae.event_type
    ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to track events (for use in triggers)
CREATE OR REPLACE FUNCTION track_analytics_event(
    event_type_param VARCHAR(100),
    user_id_param UUID,
    organization_id_param UUID,
    properties_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO product_analytics_events (
        event_type,
        user_id,
        organization_id,
        properties
    ) VALUES (
        event_type_param,
        user_id_param,
        organization_id_param,
        properties_param
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically track user signups
CREATE OR REPLACE FUNCTION track_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Track user signup event
    PERFORM track_analytics_event(
        'user_signed_up',
        NEW.id,
        NEW.organization_id,
        jsonb_build_object(
            'email', NEW.email,
            'first_name', NEW.first_name,
            'last_name', NEW.last_name,
            'signup_method', 'email'
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on users table
CREATE TRIGGER track_user_signup_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION track_user_signup();

-- Create trigger to track integration connections
CREATE OR REPLACE FUNCTION track_integration_connected()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track when status changes to 'active'
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        PERFORM track_analytics_event(
            'integration_connected',
            NEW.user_id,
            NEW.organization_id,
            jsonb_build_object(
                'integration_type', NEW.type,
                'integration_name', NEW.name,
                'integration_id', NEW.id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on integrations table
CREATE TRIGGER track_integration_connected_trigger
    AFTER INSERT OR UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION track_integration_connected();
