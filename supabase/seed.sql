-- Database Seed File for Sphyr
-- Creates comprehensive test data for development, testing, and security policy validation
-- 
-- This seed file includes:
-- - 3 test organizations with realistic business scenarios
-- - 7 test users with different roles (admin/member) across organizations
-- - Multiple integrations per organization (Gmail, Slack, QuickBooks, etc.)
-- - OAuth tokens for testing authentication flows
-- - Search history and analytics for testing search functionality
-- - Integration sync logs for testing monitoring features
--
-- Security Testing Scenarios:
-- - Organization isolation (users can only see their org's data)
-- - Role-based access control (admin vs member permissions)
-- - User data privacy (users can only access their own data)
-- - Integration security (OAuth tokens are user-specific)

-- Set environment variable for RLS testing
SET app.environment = 'development';

-- Create test organizations
INSERT INTO organizations (id, name, slug) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Acme Construction', 'acme-construction'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Tech Startup Inc', 'tech-startup'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Marketing Agency LLC', 'marketing-agency')
ON CONFLICT (id) DO NOTHING;

-- Create test users with different roles
INSERT INTO users (id, email, first_name, last_name, organization_id) VALUES
  -- Acme Construction users
  ('650e8400-e29b-41d4-a716-446655440000', 'admin@acme.com', 'John', 'Admin', '550e8400-e29b-41d4-a716-446655440000'),
  ('650e8400-e29b-41d4-a716-446655440001', 'member@acme.com', 'Jane', 'Member', '550e8400-e29b-41d4-a716-446655440000'),
  ('650e8400-e29b-41d4-a716-446655440002', 'project@acme.com', 'Bob', 'Project Manager', '550e8400-e29b-41d4-a716-446655440000'),
  
  -- Tech Startup users
  ('650e8400-e29b-41d4-a716-446655440003', 'ceo@techstartup.com', 'Alice', 'CEO', '550e8400-e29b-41d4-a716-446655440001'),
  ('650e8400-e29b-41d4-a716-446655440004', 'dev@techstartup.com', 'Charlie', 'Developer', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Marketing Agency users
  ('650e8400-e29b-41d4-a716-446655440005', 'director@marketing.com', 'Diana', 'Creative Director', '550e8400-e29b-41d4-a716-446655440002'),
  ('650e8400-e29b-41d4-a716-446655440006', 'analyst@marketing.com', 'Eve', 'Analyst', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Create user roles
INSERT INTO user_roles (user_id, role) VALUES
  -- Acme Construction roles
  ('650e8400-e29b-41d4-a716-446655440000', 'admin'),
  ('650e8400-e29b-41d4-a716-446655440001', 'member'),
  ('650e8400-e29b-41d4-a716-446655440002', 'member'),
  
  -- Tech Startup roles
  ('650e8400-e29b-41d4-a716-446655440003', 'admin'),
  ('650e8400-e29b-41d4-a716-446655440004', 'member'),
  
  -- Marketing Agency roles
  ('650e8400-e29b-41d4-a716-446655440005', 'admin'),
  ('650e8400-e29b-41d4-a716-446655440006', 'member')
ON CONFLICT (user_id) DO NOTHING;

-- Create test integrations
INSERT INTO integrations (id, organization_id, user_id, type, status, name, description, config) VALUES
  -- Acme Construction integrations
  ('750e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', 'google_gmail', 'active', 'Gmail Integration', 'Company email integration', '{"syncFrequency": "hourly", "labels": ["INBOX", "SENT"]}'),
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', 'slack', 'active', 'Slack Integration', 'Team communication', '{"channels": ["general", "dev", "projects"]}'),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', 'procore', 'active', 'Procore Integration', 'Construction project management', '{"projects": ["downtown-office", "residential-complex"]}'),
  ('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', 'quickbooks', 'active', 'QuickBooks Integration', 'Financial management', '{"companyId": "acme-construction-qb"}'),
  
  -- Tech Startup integrations
  ('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'google_gmail', 'active', 'Gmail Integration', 'Company email', '{"syncFrequency": "realtime"}'),
  ('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'google_drive', 'active', 'Google Drive Integration', 'Document storage', '{"sharedDrives": ["company-docs", "engineering"]}'),
  ('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'asana', 'active', 'Asana Integration', 'Project management', '{"workspaces": ["engineering", "product"]}'),
  
  -- Marketing Agency integrations
  ('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440005', 'google_gmail', 'active', 'Gmail Integration', 'Client communication', '{"syncFrequency": "hourly"}'),
  ('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440005', 'microsoft_outlook', 'active', 'Outlook Integration', 'Corporate email', '{"folders": ["Inbox", "Sent Items", "Clients"]}'),
  ('750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440005', 'slack', 'active', 'Slack Integration', 'Team collaboration', '{"channels": ["general", "creative", "clients"]}')
ON CONFLICT (id) DO NOTHING;

-- Create test OAuth tokens (encrypted in real implementation)
INSERT INTO oauth_tokens (id, integration_id, user_id, organization_id, access_token_encrypted, refresh_token_encrypted, token_type, expires_at, scope) VALUES
  -- Acme Construction tokens
  ('850e8400-e29b-41d4-a716-446655440000', '750e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'encrypted_access_token_1', 'encrypted_refresh_token_1', 'Bearer', NOW() + INTERVAL '1 hour', 'gmail.readonly'),
  ('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'encrypted_access_token_2', 'encrypted_refresh_token_2', 'Bearer', NOW() + INTERVAL '1 hour', 'channels:read,chat:read'),
  
  -- Tech Startup tokens
  ('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'encrypted_access_token_3', 'encrypted_refresh_token_3', 'Bearer', NOW() + INTERVAL '1 hour', 'gmail.readonly'),
  ('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'encrypted_access_token_4', 'encrypted_refresh_token_4', 'Bearer', NOW() + INTERVAL '1 hour', 'drive.readonly'),
  
  -- Marketing Agency tokens
  ('850e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'encrypted_access_token_5', 'encrypted_refresh_token_5', 'Bearer', NOW() + INTERVAL '1 hour', 'gmail.readonly'),
  ('850e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'encrypted_access_token_6', 'encrypted_refresh_token_6', 'Bearer', NOW() + INTERVAL '1 hour', 'mail.read')
ON CONFLICT (id) DO NOTHING;

-- Create test search history
INSERT INTO search_queries (id, user_id, organization_id, query, processed_query, filters) VALUES
  -- Acme Construction searches
  ('950e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'project status update', 'project status update', '{"sources": ["gmail", "slack"], "dateRange": {"start": "2024-01-01", "end": "2024-01-31"}}'),
  ('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'budget report', 'budget report', '{"sources": ["quickbooks"], "types": ["invoice", "payment"]}'),
  ('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'safety inspection', 'safety inspection', '{"sources": ["procore"], "types": ["document", "rfi"]}'),
  
  -- Tech Startup searches
  ('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'user feedback', 'user feedback', '{"sources": ["gmail", "asana"], "types": ["message", "task"]}'),
  ('950e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'API documentation', 'API documentation', '{"sources": ["google_drive"], "types": ["document"]}'),
  
  -- Marketing Agency searches
  ('950e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'client campaign', 'client campaign', '{"sources": ["gmail", "outlook"], "types": ["message"]}'),
  ('950e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'analytics report', 'analytics report', '{"sources": ["google_drive"], "types": ["spreadsheet"]}')
ON CONFLICT (id) DO NOTHING;

-- Create test search results
INSERT INTO search_results (id, search_query_id, integration_type, result_data, relevance_score) VALUES
  -- Results for Acme Construction searches
  ('a50e8400-e29b-41d4-a716-446655440000', '950e8400-e29b-41d4-a716-446655440000', 'google_gmail', '{"subject": "Project Update - Downtown Office", "from": "project@acme.com", "snippet": "Construction is on schedule..."}', 0.95),
  ('a50e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440000', 'slack', '{"channel": "projects", "user": "bob", "text": "Status update: Phase 1 complete"}', 0.88),
  ('a50e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440001', 'quickbooks', '{"type": "invoice", "number": "INV-001", "amount": 50000, "customer": "City Development"}', 0.92),
  
  -- Results for Tech Startup searches
  ('a50e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440003', 'google_gmail', '{"subject": "User Feedback - Mobile App", "from": "user@example.com", "snippet": "Great app, but needs dark mode..."}', 0.90),
  ('a50e8400-e29b-41d4-a716-446655440004', '950e8400-e29b-41d4-a716-446655440004', 'google_drive', '{"name": "API Documentation v2.1", "type": "document", "url": "https://drive.google.com/..."}', 0.85),
  
  -- Results for Marketing Agency searches
  ('a50e8400-e29b-41d4-a716-446655440005', '950e8400-e29b-41d4-a716-446655440005', 'google_gmail', '{"subject": "Campaign Performance Report", "from": "client@brand.com", "snippet": "Q1 results exceeded expectations..."}', 0.93),
  ('a50e8400-e29b-41d4-a716-446655440006', '950e8400-e29b-41d4-a716-446655440006', 'google_drive', '{"name": "Analytics Dashboard Q1", "type": "spreadsheet", "url": "https://drive.google.com/..."}', 0.87)
ON CONFLICT (id) DO NOTHING;

-- Create test search analytics
INSERT INTO search_analytics (id, search_query_id, user_id, organization_id, result_clicked, result_clicked_id, time_spent_seconds) VALUES
  ('b50e8400-e29b-41d4-a716-446655440000', '950e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', true, 'a50e8400-e29b-41d4-a716-446655440000', 45),
  ('b50e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', true, 'a50e8400-e29b-41d4-a716-446655440002', 30),
  ('b50e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', false, null, 15),
  ('b50e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', true, 'a50e8400-e29b-41d4-a716-446655440005', 60)
ON CONFLICT (id) DO NOTHING;

-- Create test integration sync logs
INSERT INTO integration_sync_logs (id, integration_id, status, message, records_processed, started_at, completed_at) VALUES
  ('c50e8400-e29b-41d4-a716-446655440000', '750e8400-e29b-41d4-a716-446655440000', 'success', 'Gmail sync completed successfully', 150, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '59 minutes'),
  ('c50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'success', 'Slack sync completed successfully', 75, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 58 minutes'),
  ('c50e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', 'error', 'Procore API rate limit exceeded', 0, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '25 minutes'),
  ('c50e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440004', 'success', 'Gmail sync completed successfully', 200, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 58 minutes')
ON CONFLICT (id) DO NOTHING;

-- Create additional test scenarios for comprehensive security testing
-- Add some edge cases and boundary conditions

-- Create a user without any integrations (for testing empty states)
INSERT INTO users (id, email, first_name, last_name, organization_id) VALUES
  ('650e8400-e29b-41d4-a716-446655440007', 'newuser@acme.com', 'New', 'User', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role) VALUES
  ('650e8400-e29b-41d4-a716-446655440007', 'member')
ON CONFLICT (user_id) DO NOTHING;

-- Create an integration with error status (for testing error handling)
INSERT INTO integrations (id, organization_id, user_id, type, status, name, description, config) VALUES
  ('750e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', 'quickbooks', 'error', 'Failed QuickBooks Integration', 'Integration with authentication error', '{"error": "Invalid credentials", "lastError": "2024-01-15T10:30:00Z"}')
ON CONFLICT (id) DO NOTHING;

-- Create some expired OAuth tokens (for testing token refresh)
INSERT INTO oauth_tokens (id, integration_id, user_id, organization_id, access_token_encrypted, refresh_token_encrypted, token_type, expires_at, scope) VALUES
  ('850e8400-e29b-41d4-a716-446655440010', '750e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'expired_access_token', 'valid_refresh_token', 'Bearer', NOW() - INTERVAL '1 hour', 'accounting.read')
ON CONFLICT (id) DO NOTHING;

-- Create some failed sync logs (for testing error monitoring)
INSERT INTO integration_sync_logs (id, integration_id, status, message, records_processed, started_at, completed_at) VALUES
  ('c50e8400-e29b-41d4-a716-446655440010', '750e8400-e29b-41d4-a716-446655440010', 'error', 'QuickBooks API authentication failed', 0, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '58 minutes'),
  ('c50e8400-e29b-41d4-a716-446655440011', '750e8400-e29b-41d4-a716-446655440000', 'partial', 'Gmail sync completed with warnings', 50, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '25 minutes')
ON CONFLICT (id) DO NOTHING;

-- Create some recent search queries (for testing real-time functionality)
INSERT INTO search_queries (id, user_id, organization_id, query, processed_query, filters) VALUES
  ('950e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'urgent project update', 'urgent project update', '{"sources": ["gmail", "slack"], "priority": "high"}'),
  ('950e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'user feedback analysis', 'user feedback analysis', '{"sources": ["gmail", "asana"], "sentiment": "positive"}'),
  ('950e8400-e29b-41d4-a716-446655440012', '650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'campaign performance metrics', 'campaign performance metrics', '{"sources": ["google_drive", "outlook"], "dateRange": {"start": "2024-01-01", "end": "2024-01-31"}}')
ON CONFLICT (id) DO NOTHING;

-- Create corresponding search results for recent queries
INSERT INTO search_results (id, search_query_id, integration_type, result_data, relevance_score) VALUES
  ('a50e8400-e29b-41d4-a716-446655440010', '950e8400-e29b-41d4-a716-446655440010', 'google_gmail', '{"subject": "URGENT: Project Status Update Required", "from": "client@construction.com", "snippet": "We need an immediate update on the downtown office project..."}', 0.98),
  ('a50e8400-e29b-41d4-a716-446655440011', '950e8400-e29b-41d4-a716-446655440011', 'google_gmail', '{"subject": "Amazing app experience!", "from": "user@example.com", "snippet": "Your app has completely transformed how I manage my projects..."}', 0.92),
  ('a50e8400-e29b-41d4-a716-446655440012', '950e8400-e29b-41d4-a716-446655440012', 'google_drive', '{"name": "Q1 Campaign Performance Report", "type": "spreadsheet", "url": "https://drive.google.com/...", "metrics": {"impressions": 100000, "clicks": 5000, "conversions": 250}}', 0.95)
ON CONFLICT (id) DO NOTHING;

-- Create analytics for recent searches
INSERT INTO search_analytics (id, search_query_id, user_id, organization_id, result_clicked, result_clicked_id, time_spent_seconds) VALUES
  ('b50e8400-e29b-41d4-a716-446655440010', '950e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', true, 'a50e8400-e29b-41d4-a716-446655440010', 120),
  ('b50e8400-e29b-41d4-a716-446655440011', '950e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', false, null, 45),
  ('b50e8400-e29b-41d4-a716-446655440012', '950e8400-e29b-41d4-a716-446655440012', '650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', true, 'a50e8400-e29b-41d4-a716-446655440012', 180)
ON CONFLICT (id) DO NOTHING;

-- Verify the seed data with detailed breakdown
SELECT 
    'Organizations' as table_name, 
    COUNT(*) as record_count,
    '3 test organizations with different business types' as description
FROM organizations
UNION ALL
SELECT 
    'Users' as table_name, 
    COUNT(*) as record_count,
    '8 test users across 3 organizations with different roles' as description
FROM users
UNION ALL
SELECT 
    'User Roles' as table_name, 
    COUNT(*) as record_count,
    'Admin and member roles for testing RBAC' as description
FROM user_roles
UNION ALL
SELECT 
    'Integrations' as table_name, 
    COUNT(*) as record_count,
    'Multiple integrations per org including error states' as description
FROM integrations
UNION ALL
SELECT 
    'OAuth Tokens' as table_name, 
    COUNT(*) as record_count,
    'Valid and expired tokens for testing auth flows' as description
FROM oauth_tokens
UNION ALL
SELECT 
    'Search Queries' as table_name, 
    COUNT(*) as record_count,
    'Historical and recent searches for testing functionality' as description
FROM search_queries
UNION ALL
SELECT 
    'Search Results' as table_name, 
    COUNT(*) as record_count,
    'Realistic search results with relevance scores' as description
FROM search_results
UNION ALL
SELECT 
    'Search Analytics' as table_name, 
    COUNT(*) as record_count,
    'User interaction data for testing analytics' as description
FROM search_analytics
UNION ALL
SELECT 
    'Integration Sync Logs' as table_name, 
    COUNT(*) as record_count,
    'Success, error, and partial sync logs for testing monitoring' as description
FROM integration_sync_logs;

-- Display test user information for easy reference
SELECT 
    'Test Users Summary' as info_type,
    u.email,
    u.first_name || ' ' || u.last_name as full_name,
    o.name as organization,
    ur.role,
    CASE 
        WHEN u.id IN (SELECT user_id FROM integrations) THEN 'Has Integrations'
        ELSE 'No Integrations'
    END as integration_status
FROM users u
JOIN organizations o ON u.organization_id = o.id
JOIN user_roles ur ON u.id = ur.user_id
ORDER BY o.name, ur.role, u.email;

-- Display organization summary
SELECT 
    'Organization Summary' as info_type,
    o.name as organization,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT CASE WHEN ur.role = 'admin' THEN u.id END) as admin_count,
    COUNT(DISTINCT CASE WHEN ur.role = 'member' THEN u.id END) as member_count,
    COUNT(DISTINCT i.id) as integration_count
FROM organizations o
LEFT JOIN users u ON o.id = u.organization_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN integrations i ON o.id = i.organization_id
GROUP BY o.id, o.name
ORDER BY o.name;
