-- Master RLS Setup Script
-- This script sets up all Row Level Security policies for the Sphyr application
-- Run this after all migrations to enable RLS on all tables

-- Note: This script should be run after all migrations and individual policy files
-- The individual policy files (001_*.sql through 006_*.sql) should be applied first

-- Verify that all required functions exist
DO $$
BEGIN
    -- Check if required functions exist
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') THEN
        RAISE EXCEPTION 'get_user_role function not found. Please run migration 005_user_roles.sql first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_user_admin') THEN
        RAISE EXCEPTION 'is_user_admin function not found. Please run migration 005_user_roles.sql first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_organization') THEN
        RAISE EXCEPTION 'get_user_organization function not found. Please run migration 005_user_roles.sql first.';
    END IF;
    
    RAISE NOTICE 'All required functions found. RLS setup can proceed.';
END $$;

-- Create a function to verify RLS is enabled on all tables
CREATE OR REPLACE FUNCTION verify_rls_setup()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        t.row_security::BOOLEAN,
        COALESCE(p.policy_count, 0)::INTEGER
    FROM information_schema.tables t
    LEFT JOIN (
        SELECT 
            schemaname,
            tablename,
            COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename
    ) p ON t.table_name = p.tablename
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;

-- Run verification
SELECT * FROM verify_rls_setup();

-- Create a function to test RLS policies (for development/testing)
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
    test_name TEXT,
    result TEXT
) AS $$
DECLARE
    test_user_id UUID;
    test_org_id UUID;
    test_org_id_2 UUID;
BEGIN
    -- Create test data (only in development)
    IF current_setting('app.environment', true) = 'development' THEN
        
        -- Create test organizations
        INSERT INTO organizations (id, name, slug) VALUES
            ('00000000-0000-0000-0000-000000000001', 'Test Org 1', 'test-org-1'),
            ('00000000-0000-0000-0000-000000000002', 'Test Org 2', 'test-org-2')
        ON CONFLICT (id) DO NOTHING;
        
        -- Create test user
        INSERT INTO users (id, email, first_name, last_name, organization_id) VALUES
            ('00000000-0000-0000-0000-000000000001', 'test@testorg1.com', 'Test', 'User', '00000000-0000-0000-0000-000000000001')
        ON CONFLICT (id) DO NOTHING;
        
        -- Create test user role
        INSERT INTO user_roles (user_id, role) VALUES
            ('00000000-0000-0000-0000-000000000001', 'admin')
        ON CONFLICT (user_id) DO NOTHING;
        
        test_user_id := '00000000-0000-0000-0000-000000000001';
        test_org_id := '00000000-0000-0000-0000-000000000001';
        test_org_id_2 := '00000000-0000-0000-0000-000000000002';
        
        -- Test organization access
        RETURN QUERY SELECT 'Organization Access'::TEXT, 
            CASE WHEN get_user_organization(test_user_id) = test_org_id 
                 THEN 'PASS'::TEXT 
                 ELSE 'FAIL'::TEXT 
            END;
        
        -- Test admin role
        RETURN QUERY SELECT 'Admin Role Check'::TEXT, 
            CASE WHEN is_user_admin(test_user_id) = true 
                 THEN 'PASS'::TEXT 
                 ELSE 'FAIL'::TEXT 
            END;
        
        -- Test user role
        RETURN QUERY SELECT 'User Role Check'::TEXT, 
            CASE WHEN get_user_role(test_user_id) = 'admin' 
                 THEN 'PASS'::TEXT 
                 ELSE 'FAIL'::TEXT 
            END;
    ELSE
        RETURN QUERY SELECT 'RLS Test'::TEXT, 'Skipped in production'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Run RLS tests (only in development)
SELECT * FROM test_rls_policies();
