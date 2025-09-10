# Row Level Security (RLS) Policies for Sphyr

This directory contains all Row Level Security policies for the Sphyr application, ensuring proper data isolation and access control in a multi-tenant environment.

## File Structure

```
supabase/policies/
├── README.md                    # This file
├── 000_setup_rls.sql           # Master setup and verification script
├── 001_organizations_rls.sql   # Organization-level policies
├── 002_users_rls.sql          # User and role management policies
├── 003_integrations_rls.sql   # Integration access policies
├── 004_oauth_tokens_rls.sql   # OAuth token security policies
├── 005_search_data_rls.sql    # Search history and analytics policies
└── 006_user_sessions_rls.sql  # User session management policies
```

## Implementation Order

**IMPORTANT**: These files must be applied in the correct order:

1. **First**: Run migration `005_user_roles.sql` to create the user roles system
2. **Then**: Apply RLS policy files in numerical order (001 through 006)
3. **Finally**: Run `000_setup_rls.sql` to verify the implementation

## Security Model

### Multi-Tenant Architecture
- **Organization Isolation**: Users can only access data within their organization
- **Role-Based Access**: Admin and member roles with different permissions
- **User Data Privacy**: Users can only access their own personal data

### Access Control Levels

#### 1. Organization Level
- Users can only see their own organization
- Admins can manage organization settings
- Complete data isolation between organizations

#### 2. User Level
- Users can view other users in their organization
- Users can only modify their own profile
- Admins can manage users in their organization

#### 3. Integration Level
- Users can only access integrations in their organization
- Users can manage their own integrations
- Admins can manage all integrations in their organization

#### 4. Data Level
- Search history is private to each user
- Admins can view analytics for their organization
- OAuth tokens are encrypted and user-specific

## Key Functions

### `get_user_organization(user_uuid UUID)`
Returns the organization ID for a given user.

### `is_user_admin(user_uuid UUID)`
Returns true if the user has admin role.

### `get_user_role(user_uuid UUID)`
Returns the role of a given user ('admin' or 'member').

## Testing

### Development Testing
```sql
-- Set environment to development
SET app.environment = 'development';

-- Run verification
SELECT * FROM verify_rls_setup();

-- Run tests
SELECT * FROM test_rls_policies();
```

### Manual Testing
```sql
-- Test as a specific user (replace with actual user ID)
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-here"}';

-- Try to access data
SELECT * FROM organizations;
SELECT * FROM users;
SELECT * FROM integrations;
```

## Security Considerations

### Production Deployment
1. **Never disable RLS** in production
2. **Test all policies** before deployment
3. **Monitor access patterns** for anomalies
4. **Regular security audits** of policies

### Development
1. **Use seed data** for consistent testing
2. **Test with different user roles**
3. **Verify organization isolation**
4. **Check admin vs member permissions**

## Troubleshooting

### Common Issues

#### "RLS policy violation"
- Check if user has proper role assigned
- Verify user belongs to correct organization
- Ensure policies are applied in correct order

#### "Function not found"
- Run migration `005_user_roles.sql` first
- Check if functions exist: `SELECT * FROM pg_proc WHERE proname LIKE '%user%';`

#### "No data returned"
- Verify RLS is enabled: `SELECT * FROM verify_rls_setup();`
- Check user authentication: `SELECT auth.uid();`
- Test with seed data

### Debugging Queries
```sql
-- Check current user
SELECT auth.uid();

-- Check user's organization
SELECT get_user_organization(auth.uid());

-- Check user's role
SELECT get_user_role(auth.uid());

-- Check if user is admin
SELECT is_user_admin(auth.uid());

-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## Maintenance

### Adding New Tables
1. Create table with proper foreign keys
2. Add RLS policy file following naming convention
3. Update verification functions
4. Test with seed data

### Modifying Policies
1. Test changes in development first
2. Use transaction blocks for safe updates
3. Verify policies after changes
4. Update documentation

### Performance Monitoring
- Monitor query performance with RLS enabled
- Add indexes for policy conditions if needed
- Use `EXPLAIN ANALYZE` to check policy impact

## Compliance

This RLS implementation helps ensure compliance with:
- **GDPR**: Data isolation and user privacy
- **SOC 2**: Access controls and data security
- **HIPAA**: Patient data protection (if applicable)
- **Industry Standards**: Multi-tenant security best practices
