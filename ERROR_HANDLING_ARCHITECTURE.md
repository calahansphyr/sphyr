# Sphyr Error Handling Architecture

## Overview

This document outlines the comprehensive error handling system implemented for Sphyr, following the Adapter Pattern and DRY principles to create a robust, maintainable, and production-ready error management system.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING LAYERS                        │
├─────────────────────────────────────────────────────────────────┤
│ 1. REACT ERROR BOUNDARY LAYER                                  │
│    ├── ErrorBoundary Component (Global App Protection)         │
│    ├── Component-level Error Recovery                          │
│    └── User-friendly Fallback UI                              │
├─────────────────────────────────────────────────────────────────┤
│ 2. MONITORING & REPORTING LAYER                                │
│    ├── MonitoringService (Sentry Integration)                  │
│    ├── Error Queue Management                                  │
│    └── Performance Metrics Tracking                            │
├─────────────────────────────────────────────────────────────────┤
│ 3. STANDARDIZED ERROR CLASSES                                  │
│    ├── SphyrError (Base Class)                                 │
│    ├── APIError, NetworkError, ValidationError                 │
│    ├── IntegrationError, AuthenticationError                   │
│    └── SystemError, AuthorizationError                         │
├─────────────────────────────────────────────────────────────────┤
│ 4. ADAPTER PATTERN LAYER                                       │
│    ├── GmailAdapter (Google Gmail Integration)                 │
│    ├── Standardized Error Translation                          │
│    └── Vendor-specific Error Handling                          │
├─────────────────────────────────────────────────────────────────┤
│ 5. API CLIENT LAYER                                            │
│    ├── ApiClient (Centralized HTTP + Retry Logic)              │
│    ├── Timeout Handling                                        │
│    ├── Exponential Backoff                                     │
│    └── Error Message Standardization                           │
├─────────────────────────────────────────────────────────────────┤
│ 6. MIDDLEWARE LAYER                                            │
│    ├── Authentication Errors (401)                             │
│    ├── CORS Headers                                            │
│    └── Security Headers                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Standardized Error Classes (`src/lib/errors.ts`)

**Base Class: `SphyrError`**
- Extends native `Error` with additional context and metadata
- Includes unique error IDs for tracking
- Provides user-friendly error messages
- Supports retry logic and severity levels

**Specialized Error Classes:**
- `APIError`: HTTP-related errors with status codes
- `NetworkError`: Connection and timeout issues
- `ValidationError`: Input validation failures
- `IntegrationError`: Third-party service errors
- `AuthenticationError`: Auth-related issues
- `AuthorizationError`: Permission-related issues
- `SystemError`: Unexpected system errors

### 2. Monitoring Service (`src/lib/monitoring.ts`)

**Features:**
- Sentry integration for production error tracking
- Development mode console logging
- Error queuing for initialization delays
- Performance metrics tracking
- User context management
- Breadcrumb support for debugging

**Usage:**
```typescript
import { reportError, trackMetric } from '@/lib/monitoring';

// Report an error
await reportError(error, { context: 'additional info' });

// Track performance
await trackMetric('api_response_time', 150, 'ms');
```

### 3. React Error Boundary (`src/components/shared/ErrorBoundary.tsx`)

**Features:**
- Catches JavaScript errors in component tree
- Displays user-friendly fallback UI
- Automatic retry mechanism
- Error reporting integration
- Development mode detailed error display

**Usage:**
```typescript
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

<ErrorBoundary maxRetries={3} resetOnPropsChange={true}>
  <YourComponent />
</ErrorBoundary>
```

### 4. Adapter Pattern Implementation

**Gmail Adapter Example (`src/lib/integrations/google/gmail-adapter.ts`):**
- Wraps Google Gmail API calls
- Translates vendor-specific errors to standardized `IntegrationError`
- Provides consistent interface for Gmail operations
- Handles OAuth2 authentication and token refresh

**Benefits:**
- Consistent error handling across all integrations
- Easy to add new integrations
- Vendor SDK isolation
- Centralized error translation

### 5. Enhanced API Client (`src/lib/api-client.ts`)

**Improvements:**
- Uses standardized error classes
- Automatic error reporting
- Enhanced retry logic with exponential backoff
- Detailed error context and metadata

## Error Flow Example

```
1. User Action → Component Error
2. ErrorBoundary catches error
3. ErrorBoundary creates SystemError
4. MonitoringService reports to Sentry/Console
5. User sees friendly fallback UI
6. Error is tracked with unique ID
```

## Integration Strategy

### Adapter Pattern Benefits

1. **Consistency**: All integrations use the same error handling patterns
2. **Maintainability**: Easy to update error handling logic in one place
3. **Vendor Isolation**: Changes to vendor SDKs don't affect core application
4. **Testing**: Easy to mock integrations for testing
5. **Error Translation**: Vendor-specific errors become standardized

### Implementation Steps

1. **Create Adapter**: Implement adapter for each integration
2. **Error Translation**: Convert vendor errors to `IntegrationError`
3. **Standardized Interface**: Provide consistent API across all adapters
4. **Error Reporting**: Integrate with monitoring service
5. **Testing**: Mock adapters for unit tests

## Best Practices Implemented

### ✅ DRY Principles
- Centralized error messages in `ERROR_MESSAGES`
- Reusable error classes and utilities
- Shared monitoring service
- Consistent error handling patterns

### ✅ Security
- No sensitive data in error messages
- Proper error sanitization
- Secure error reporting
- User context isolation

### ✅ Performance
- Lazy loading of monitoring service
- Error queuing for initialization
- Efficient error serialization
- Minimal performance impact

### ✅ User Experience
- User-friendly error messages
- Graceful degradation
- Retry mechanisms
- Fallback UI components

### ✅ Developer Experience
- Detailed error information in development
- Unique error IDs for tracking
- Comprehensive error context
- Easy debugging tools

## Configuration

### Environment Variables

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Error Monitoring
NODE_ENV=production  # Enables Sentry reporting
```

### Package Dependencies

```json
{
  "dependencies": {
    "@sentry/nextjs": "^7.x.x",
    "googleapis": "^118.x.x"
  }
}
```

## Usage Examples

### Basic Error Handling

```typescript
import { APIError, reportError } from '@/lib/errors';

try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new APIError('Failed to fetch data', response.status);
  }
} catch (error) {
  await reportError(error, { operation: 'fetchData' });
  throw error;
}
```

### Integration Error Handling

```typescript
import { GmailAdapter } from '@/lib/integrations/google/gmail-adapter';

const gmailAdapter = new GmailAdapter(config);

try {
  const messages = await gmailAdapter.searchMessages({ query: 'test' });
} catch (error) {
  // Error is automatically translated to IntegrationError
  // and reported to monitoring service
  console.error('Gmail search failed:', error.getUserMessage());
}
```

### Component Error Handling

```typescript
import { useErrorHandler } from '@/components/shared/ErrorBoundary';

function MyComponent() {
  const handleError = useErrorHandler();
  
  const handleClick = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      handleError(error); // Triggers error boundary
    }
  };
}
```

## Monitoring and Alerting

### Error Tracking
- All errors are automatically tracked with unique IDs
- Context and metadata are preserved
- User information is included when available
- Performance impact is minimized

### Production Monitoring
- Sentry integration for real-time error tracking
- Error categorization and severity levels
- User impact assessment
- Performance metrics correlation

### Development Debugging
- Detailed console logging
- Error context preservation
- Stack trace information
- Component hierarchy tracking

## Future Enhancements

1. **Error Analytics Dashboard**: Visual error tracking and trends
2. **Automated Error Recovery**: Self-healing mechanisms
3. **Error Prediction**: ML-based error prevention
4. **Enhanced User Feedback**: In-app error reporting
5. **Integration Health Monitoring**: Real-time integration status

## Conclusion

This error handling architecture provides:

- **Robustness**: Comprehensive error coverage across all layers
- **Consistency**: Standardized error handling patterns
- **Maintainability**: DRY principles and centralized management
- **User Experience**: Graceful error handling and recovery
- **Developer Experience**: Easy debugging and monitoring
- **Scalability**: Adapter pattern for easy integration expansion

The system follows industry best practices and provides a solid foundation for a production-ready SaaS application.
