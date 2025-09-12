# 🔧 Environment Configuration Guide

## Quick Setup

1. **Copy the template below to `.env.local`**
2. **Fill in your actual values**
3. **Run validation**: `npm run validate-env`

## Environment Template

Create a file named `.env.local` in your project root with the following content:

```bash
# =============================================================================
# SPHYR ENVIRONMENT CONFIGURATION
# =============================================================================
# Copy this template to .env.local and fill in your actual values
# DO NOT commit .env.local to version control

# =============================================================================
# DATABASE CONFIGURATION - REQUIRED
# =============================================================================
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# =============================================================================
# OAUTH PROVIDERS - Start with Google for MVP
# =============================================================================
# Google Workspace - REQUIRED for MVP
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Slack - Optional for MVP
SLACK_CLIENT_ID=your-slack-oauth-client-id
SLACK_CLIENT_SECRET=your-slack-oauth-client-secret

# Asana - Optional for MVP
ASANA_CLIENT_ID=your-asana-oauth-client-id
ASANA_CLIENT_SECRET=your-asana-oauth-client-secret

# QuickBooks - Optional for MVP
QUICKBOOKS_CLIENT_ID=your-quickbooks-oauth-client-id
QUICKBOOKS_CLIENT_SECRET=your-quickbooks-oauth-client-secret
QUICKBOOKS_ENVIRONMENT=sandbox

# Microsoft - Optional for MVP
MICROSOFT_CLIENT_ID=your-microsoft-oauth-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-oauth-client-secret
MICROSOFT_TENANT_ID=common

# Procore - Optional for MVP
PROCORE_CLIENT_ID=your-procore-oauth-client-id
PROCORE_CLIENT_SECRET=your-procore-oauth-client-secret
PROCORE_BASE_URL=https://api.procore.com

# =============================================================================
# AI CONFIGURATION - REQUIRED for MVP
# =============================================================================
# Cerebras AI - Core functionality
CEREBRAS_API_KEY=your-cerebras-api-key
CEREBRAS_API_URL=https://api.cerebras.ai/v1
CEREBRAS_MODEL=cerebras-llama-2-7b-chat
CEREBRAS_MAX_TOKENS=2048
CEREBRAS_TEMPERATURE=0.7
CEREBRAS_TIMEOUT=30000
CEREBRAS_RETRY_ATTEMPTS=3
CEREBRAS_RETRY_DELAY=1000

# AI Feature Flags
AI_ENABLED=true
AI_QUERY_PROCESSING=true
AI_RESULT_RANKING=true
AI_CONTEXT_BUILDING=true
AI_CACHE_ENABLED=true
AI_CACHE_TTL=300
AI_CACHE_MAX_SIZE=1000

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
# Base URL - Update for production
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Environment
NODE_ENV=development

# JWT Secret - Generate a secure random string
JWT_SECRET=your-secure-jwt-secret-key

# =============================================================================
# FEATURE FLAGS - MVP Configuration
# =============================================================================
# Core Features
FEATURE_SEARCH=true
FEATURE_INTEGRATIONS=true
FEATURE_AI=true

# Integration Features
FEATURE_GOOGLE_WORKSPACE=true
FEATURE_CONSTRUCTION_INTEGRATIONS=false
FEATURE_PROJECT_MANAGEMENT=false
FEATURE_BUSINESS_TOOLS=false

# AI Features
FEATURE_AI_QUERY_PROCESSING=true
FEATURE_AI_RESULT_RANKING=true
FEATURE_AI_CONTEXT_BUILDING=true

# UI Features
FEATURE_DARK_MODE=true
FEATURE_ADVANCED_SEARCH=false
FEATURE_SEARCH_HISTORY=true
FEATURE_ANALYTICS=false

# Development Features
FEATURE_DEBUG_MODE=false
FEATURE_MOCK_INTEGRATIONS=false
FEATURE_PERFORMANCE_MONITORING=true
```

## Setup Instructions

### 1. Database Setup (Supabase)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings → API to get your credentials
3. Copy the Project URL to `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the anon public key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy the service_role secret key to `SUPABASE_SERVICE_ROLE_KEY`

### 2. OAuth Setup (Google - Required for MVP)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google Workspace APIs (Gmail, Drive, Calendar, etc.)
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env.local`

### 3. AI Setup (Cerebras - Required for MVP)
1. Go to [cerebras.ai](https://cerebras.ai) and sign up
2. Get your API key from the dashboard
3. Copy the API key to `CEREBRAS_API_KEY`

### 4. Generate JWT Secret
```bash
# Generate a secure random string
openssl rand -base64 32
```

### 5. Validate Configuration
```bash
npm run validate-env
```

## Required vs Optional

### Required for MVP Launch
- ✅ Supabase credentials
- ✅ Google OAuth credentials  
- ✅ Cerebras API key
- ✅ JWT secret
- ✅ Base URL

### Optional (Add Later)
- 🔄 Other OAuth providers (Slack, Asana, etc.)
- 🔄 Analytics services
- 🔄 Monitoring tools
- 🔄 Email services

## Security Notes

- **Never commit `.env.local` to version control**
- **Use different credentials for development and production**
- **Rotate secrets regularly**
- **Use environment-specific feature flags**

## Troubleshooting

### Common Issues
1. **"Missing required environment variables"** - Check that all required variables are set
2. **"Invalid Supabase credentials"** - Verify your Supabase project is active
3. **"OAuth redirect mismatch"** - Ensure redirect URIs match exactly
4. **"AI service unavailable"** - Check your Cerebras API key and quota

### Validation
Run the validation script to check your configuration:
```bash
npm run validate-env
```

This will verify all required environment variables are present and properly formatted.
