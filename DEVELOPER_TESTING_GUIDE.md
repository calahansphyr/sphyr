# 🧪 Developer Testing Guide for Sphyr Security

This guide helps developers test the Row Level Security (RLS) policies and understand the multi-tenant architecture using the comprehensive seed data.

## 🚀 Quick Start

### 1. Set Up Development Environment
```bash
# Reset and seed the database
npm run db:setup

# Start the development server
npm run dev
```

### 2. Verify Seed Data
```bash
# Connect to Supabase shell
supabase db shell

# Run verification queries
SELECT * FROM verify_rls_setup();
SELECT * FROM test_rls_policies();
```

## 📊 Test Data Overview

### Organizations (3)
- **Acme Construction** - Construction company with multiple integrations
- **Tech Startup Inc** - Software company with development focus
- **Marketing Agency LLC** - Marketing agency with client management

### Users (8 total)
| Organization | User | Role | Email | Integrations |
|-------------|------|------|-------|-------------|
| Acme Construction | John Admin | admin | admin@acme.com | Gmail, Slack, Procore, QuickBooks |
| Acme Construction | Jane Member | member | member@acme.com | None |
| Acme Construction | Bob Project Manager | member | project@acme.com | None |
| Acme Construction | New User | member | newuser@acme.com | None |
| Tech Startup | Alice CEO | admin | ceo@techstartup.com | Gmail, Drive, Asana |
| Tech Startup | Charlie Developer | member | dev@techstartup.com | None |
| Marketing Agency | Diana Creative Director | admin | director@marketing.com | Gmail, Outlook, Slack |
| Marketing Agency | Eve Analyst | member | analyst@marketing.com | None |

## 🔒 Security Testing Scenarios

### Test 1: Organization Isolation

#### Objective
Verify that users can only access data from their own organization.

#### Test Steps
```sql
-- Simulate logging in as John Admin (Acme Construction)
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440000"}';

-- Test 1a: Can only see own organization
SELECT * FROM organizations;
-- Expected: Only "Acme Construction" should be returned

-- Test 1b: Can only see users in own organization
SELECT * FROM users;
-- Expected: Only Acme Construction users (John, Jane, Bob, New User)

-- Test 1c: Cannot see other organizations' integrations
SELECT * FROM integrations;
-- Expected: Only Acme Construction integrations
```

#### Expected Results
- ✅ Users can only see their organization's data
- ✅ No cross-organization data leakage
- ✅ Complete multi-tenant isolation

### Test 2: Role-Based Access Control

#### Objective
Verify that admin and member roles have different permissions.

#### Test Steps
```sql
-- Test 2a: Admin can manage organization
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440000"}'; -- John Admin
UPDATE organizations SET name = 'Acme Construction Updated' WHERE id = '550e8400-e29b-41d4-a716-446655440000';
-- Expected: Should succeed

-- Test 2b: Member cannot manage organization
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440001"}'; -- Jane Member
UPDATE organizations SET name = 'Acme Construction Hacked' WHERE id = '550e8400-e29b-41d4-a716-446655440000';
-- Expected: Should fail with permission denied

-- Test 2c: Admin can view all integrations in organization
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440000"}'; -- John Admin
SELECT * FROM integrations;
-- Expected: All Acme Construction integrations

-- Test 2d: Member can only see their own integrations
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440001"}'; -- Jane Member
SELECT * FROM integrations;
-- Expected: Only Jane's integrations (none in this case)
```

#### Expected Results
- ✅ Admins have full organization management rights
- ✅ Members have limited access to organization data
- ✅ Role-based permissions work correctly

### Test 3: User Data Privacy

#### Objective
Verify that users can only access their own personal data.

#### Test Steps
```sql
-- Test 3a: Users can only see their own search history
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440000"}'; -- John Admin
SELECT * FROM search_queries;
-- Expected: Only John's search queries

-- Test 3b: Users can only see their own OAuth tokens
SELECT * FROM oauth_tokens;
-- Expected: Only John's OAuth tokens

-- Test 3c: Users can update their own profile
UPDATE users SET first_name = 'Johnny' WHERE id = '650e8400-e29b-41d4-a716-446655440000';
-- Expected: Should succeed

-- Test 3d: Users cannot update other users' profiles
UPDATE users SET first_name = 'Hacked' WHERE id = '650e8400-e29b-41d4-a716-446655440001';
-- Expected: Should fail with permission denied
```

#### Expected Results
- ✅ Users can only access their own personal data
- ✅ Search history is private to each user
- ✅ OAuth tokens are user-specific
- ✅ Profile updates are restricted to own profile

### Test 4: Integration Security

#### Objective
Verify that integrations and OAuth tokens are properly secured.

#### Test Steps
```sql
-- Test 4a: Users can only manage their own integrations
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440000"}'; -- John Admin
SELECT * FROM integrations WHERE user_id = '650e8400-e29b-41d4-a716-446655440000';
-- Expected: Only John's integrations

-- Test 4b: OAuth tokens are encrypted and user-specific
SELECT access_token_encrypted, refresh_token_encrypted FROM oauth_tokens;
-- Expected: Encrypted tokens, only for current user

-- Test 4c: Integration sync logs are organization-scoped
SELECT * FROM integration_sync_logs;
-- Expected: Only sync logs for organization's integrations
```

#### Expected Results
- ✅ Integrations are user-specific
- ✅ OAuth tokens are encrypted and private
- ✅ Sync logs respect organization boundaries

### Test 5: Edge Cases and Error Handling

#### Objective
Test edge cases and error scenarios with the seed data.

#### Test Steps
```sql
-- Test 5a: User without integrations (New User)
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440007"}'; -- New User
SELECT * FROM integrations;
-- Expected: Empty result set (no integrations)

-- Test 5b: Integration with error status
SELECT * FROM integrations WHERE status = 'error';
-- Expected: Failed QuickBooks integration should be visible to admin

-- Test 5c: Expired OAuth tokens
SELECT * FROM oauth_tokens WHERE expires_at < NOW();
-- Expected: Expired tokens should be visible to token owner

-- Test 5d: Failed sync logs
SELECT * FROM integration_sync_logs WHERE status = 'error';
-- Expected: Error logs should be visible to organization members
```

#### Expected Results
- ✅ Empty states handled gracefully
- ✅ Error states are properly accessible
- ✅ Expired tokens are visible for refresh
- ✅ Error logs provide debugging information

## 🎯 API Testing Scenarios

### Test 6: Search API Security

#### Objective
Test the search API with different user contexts.

#### Test Steps
```bash
# Test 6a: Search as admin user
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token" \
  -d '{"query": "project status"}'

# Test 6b: Search as member user
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer member-token" \
  -d '{"query": "budget report"}'
```

#### Expected Results
- ✅ Search results are filtered by user's organization
- ✅ Users can only see their own search history
- ✅ Integration access respects user permissions

### Test 7: Integration API Security

#### Objective
Test integration management APIs.

#### Test Steps
```bash
# Test 7a: List integrations as admin
curl -X GET http://localhost:3000/api/integrations \
  -H "Authorization: Bearer admin-token"

# Test 7b: List integrations as member
curl -X GET http://localhost:3000/api/integrations \
  -H "Authorization: Bearer member-token"
```

#### Expected Results
- ✅ Admins can see all organization integrations
- ✅ Members can only see their own integrations
- ✅ Cross-organization access is blocked

## 🔍 Debugging and Troubleshooting

### Common Issues and Solutions

#### Issue: "RLS policy violation"
```sql
-- Check user authentication
SELECT auth.uid();

-- Check user's organization
SELECT get_user_organization(auth.uid());

-- Check user's role
SELECT get_user_role(auth.uid());
```

#### Issue: "No data returned"
```sql
-- Verify RLS is enabled
SELECT * FROM verify_rls_setup();

-- Check if user has proper role
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- Test with seed data
SELECT * FROM users WHERE email = 'admin@acme.com';
```

#### Issue: "Permission denied"
```sql
-- Check if user is admin
SELECT is_user_admin(auth.uid());

-- Verify organization membership
SELECT * FROM users WHERE id = auth.uid();
```

### Debugging Queries

```sql
-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check RLS status on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Test specific policy
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM organizations 
WHERE id = get_user_organization(auth.uid());
```

## 📈 Performance Testing

### Test 8: Performance with RLS

#### Objective
Verify that RLS policies don't significantly impact performance.

#### Test Steps
```sql
-- Test 8a: Query performance with RLS
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM search_queries 
WHERE user_id = auth.uid();

-- Test 8b: Complex query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT s.*, sr.* 
FROM search_queries s
JOIN search_results sr ON s.id = sr.search_query_id
WHERE s.user_id = auth.uid();
```

#### Expected Results
- ✅ Queries complete within acceptable time limits
- ✅ RLS policies use indexes efficiently
- ✅ No significant performance degradation

## 🎉 Success Criteria

### Security Tests Pass When:
- ✅ Users can only access their organization's data
- ✅ Role-based permissions work correctly
- ✅ Personal data is private to each user
- ✅ OAuth tokens are secure and user-specific
- ✅ Cross-organization access is completely blocked
- ✅ Error states are handled gracefully
- ✅ Performance remains acceptable with RLS enabled

### Development Experience Improved When:
- ✅ New developers can quickly understand the data model
- ✅ Testing scenarios are clear and comprehensive
- ✅ Debugging tools are readily available
- ✅ Edge cases are covered in seed data
- ✅ Documentation is clear and actionable

## 📞 Getting Help

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Review the RLS policies** in `/supabase/policies/`
3. **Run verification functions** to diagnose issues
4. **Check the seed data** to understand expected behavior
5. **Contact the development team** for complex issues

---

**Happy Testing!** 🚀

This comprehensive seed data and testing guide ensures that the Sphyr application's security policies work correctly and provides an excellent developer experience.
