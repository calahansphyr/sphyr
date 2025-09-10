# 🧪 Test Users Reference Card

Quick reference for testing the Sphyr application with different user roles and organizations.

## 🏢 Organizations

| ID | Name | Slug | Description |
|----|------|------|-------------|
| `550e8400-e29b-41d4-a716-446655440000` | Acme Construction | acme-construction | Construction company with multiple integrations |
| `550e8400-e29b-41d4-a716-446655440001` | Tech Startup Inc | tech-startup | Software company with development focus |
| `550e8400-e29b-41d4-a716-446655440002` | Marketing Agency LLC | marketing-agency | Marketing agency with client management |

## 👥 Test Users

### Acme Construction Users

| Name | Email | Role | User ID | Integrations | Use Case |
|------|-------|------|---------|-------------|----------|
| **John Admin** | admin@acme.com | admin | `650e8400-e29b-41d4-a716-446655440000` | Gmail, Slack, Procore, QuickBooks | Test admin permissions, organization management |
| **Jane Member** | member@acme.com | member | `650e8400-e29b-41d4-a716-446655440001` | None | Test member permissions, empty integration state |
| **Bob Project Manager** | project@acme.com | member | `650e8400-e29b-41d4-a716-446655440002` | None | Test member permissions, project-focused user |
| **New User** | newuser@acme.com | member | `650e8400-e29b-41d4-a716-446655440007` | None | Test new user onboarding, empty states |

### Tech Startup Users

| Name | Email | Role | User ID | Integrations | Use Case |
|------|-------|------|---------|-------------|----------|
| **Alice CEO** | ceo@techstartup.com | admin | `650e8400-e29b-41d4-a716-446655440003` | Gmail, Drive, Asana | Test admin permissions, tech company scenario |
| **Charlie Developer** | dev@techstartup.com | member | `650e8400-e29b-41d4-a716-446655440004` | None | Test member permissions, developer workflow |

### Marketing Agency Users

| Name | Email | Role | User ID | Integrations | Use Case |
|------|-------|------|---------|-------------|----------|
| **Diana Creative Director** | director@marketing.com | admin | `650e8400-e29b-41d4-a716-446655440005` | Gmail, Outlook, Slack | Test admin permissions, marketing agency scenario |
| **Eve Analyst** | analyst@marketing.com | member | `650e8400-e29b-41d4-a716-446655440006` | None | Test member permissions, analytics-focused user |

## 🔑 Quick Test Scenarios

### Test Organization Isolation
```sql
-- Login as John Admin (Acme Construction)
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440000"}';
SELECT * FROM organizations; -- Should only see Acme Construction
```

### Test Role-Based Access
```sql
-- Test admin permissions
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440000"}'; -- John Admin
UPDATE organizations SET name = 'Test' WHERE id = '550e8400-e29b-41d4-a716-446655440000'; -- Should succeed

-- Test member permissions
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440001"}'; -- Jane Member
UPDATE organizations SET name = 'Test' WHERE id = '550e8400-e29b-41d4-a716-446655440000'; -- Should fail
```

### Test Cross-Organization Access
```sql
-- Login as John Admin (Acme Construction)
SET LOCAL "request.jwt.claims" TO '{"sub": "650e8400-e29b-41d4-a716-446655440000"}';
SELECT * FROM users; -- Should only see Acme Construction users
SELECT * FROM integrations; -- Should only see Acme Construction integrations
```

## 🎯 Integration Testing

### Available Integrations by Organization

#### Acme Construction
- **Gmail Integration** - Company email
- **Slack Integration** - Team communication
- **Procore Integration** - Construction project management
- **QuickBooks Integration** - Financial management
- **Failed QuickBooks Integration** - Error state testing

#### Tech Startup Inc
- **Gmail Integration** - Company email
- **Google Drive Integration** - Document storage
- **Asana Integration** - Project management

#### Marketing Agency LLC
- **Gmail Integration** - Client communication
- **Outlook Integration** - Corporate email
- **Slack Integration** - Team collaboration

## 🔍 Search History Examples

### Acme Construction Searches
- "project status update" - John Admin
- "budget report" - Jane Member
- "safety inspection" - Bob Project Manager
- "urgent project update" - John Admin (recent)

### Tech Startup Searches
- "user feedback" - Alice CEO
- "API documentation" - Charlie Developer
- "user feedback analysis" - Alice CEO (recent)

### Marketing Agency Searches
- "client campaign" - Diana Creative Director
- "analytics report" - Eve Analyst
- "campaign performance metrics" - Diana Creative Director (recent)

## 🚨 Error States for Testing

### Failed Integrations
- **QuickBooks Integration** (Acme Construction) - Authentication error
- **Expired OAuth Token** - Token refresh testing

### Sync Log States
- **Success** - Normal operation
- **Error** - API failures
- **Partial** - Incomplete syncs

## 📊 Analytics Data

### Search Analytics Examples
- **High Engagement** - 120 seconds, result clicked
- **Low Engagement** - 15 seconds, no click
- **Medium Engagement** - 60 seconds, result clicked

### User Behavior Patterns
- **Admin Users** - More comprehensive searches, longer engagement
- **Member Users** - Focused searches, shorter engagement
- **New Users** - No search history (empty state testing)

## 🛠️ Development Commands

### Reset and Seed Database
```bash
npm run db:setup
```

### Connect to Database
```bash
supabase db shell
```

### Verify RLS Setup
```sql
SELECT * FROM verify_rls_setup();
SELECT * FROM test_rls_policies();
```

### View Test Data Summary
```sql
-- Run the summary queries at the end of seed.sql
-- This will show all test data counts and user information
```

## 🎯 Testing Checklist

### Security Tests
- [ ] Organization isolation works
- [ ] Role-based access control works
- [ ] User data privacy is maintained
- [ ] OAuth tokens are secure
- [ ] Cross-organization access is blocked

### Functionality Tests
- [ ] Search works with different user contexts
- [ ] Integrations are properly scoped
- [ ] Error states are handled gracefully
- [ ] Empty states work correctly
- [ ] Analytics data is accurate

### Performance Tests
- [ ] RLS policies don't impact performance
- [ ] Queries complete within acceptable time
- [ ] Indexes are used efficiently

---

**Pro Tip**: Use this reference card alongside the `DEVELOPER_TESTING_GUIDE.md` for comprehensive testing of the Sphyr application's security and functionality.
