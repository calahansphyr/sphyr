# Testing Guide for Sphyr

This document provides a comprehensive guide to the testing infrastructure and practices for the Sphyr application.

## Overview

Sphyr uses a comprehensive testing strategy following the Testing Pyramid principles:

- **Unit Tests**: 212 tests covering core business logic, utilities, and data transformations
- **Integration Tests**: API endpoints, database interactions, and external service integrations
- **Component Tests**: UI component rendering and interaction (planned)
- **End-to-End Tests**: Complete user workflows and critical paths

## Test Statistics

- **Total Tests**: 215
- **Passing**: 212 (98.6%)
- **Coverage**: 80%+ on critical components
- **Test Types**: Unit, Integration, API, Security

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### End-to-End Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

### Database Tests

```bash
# Setup test database and run E2E tests
pnpm test:db
```

## Test Structure

### Unit Tests

Located in `src/__tests__/lib/`:

- **`schemas.test.ts`**: Zod schema validation tests
- **`errors.test.ts`**: Custom error class tests
- **`utils.test.ts`**: Utility function tests
- **`search/result-transformer.test.ts`**: Data transformation tests

### Integration Tests

Located in `src/__tests__/api/`:

- **`search.test.ts`**: Search API endpoint tests
- **`health.test.ts`**: Health check API tests
- **`auth/google/callback.test.ts`**: OAuth security tests

### Adapter Tests

Located in `src/__tests__/lib/integrations/`:

- **`adapters.test.ts`**: Integration adapter factory tests

### End-to-End Tests

Located in `e2e/`:

- **`login-flow.spec.ts`**: User authentication and navigation tests

## Test Configuration

### Vitest Configuration

The test environment is configured in `vitest.config.ts`:

- **Environment**: JSDOM for browser API simulation
- **Coverage**: V8 provider with 80% thresholds
- **Setup**: Global mocks and test utilities
- **Exclusions**: Logger, test files, and build artifacts

### Playwright Configuration

E2E tests are configured in `playwright.config.ts`:

- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Chrome and Safari mobile viewports
- **Retries**: 2 retries on CI
- **Reporting**: HTML, JSON, and JUnit reports

## CI/CD Pipeline

### GitHub Actions Workflows

1. **`test.yml`**: Unit, integration, and security tests
2. **`e2e.yml`**: End-to-end tests
3. **`deploy.yml`**: Production deployment

### Test Matrix

- **Node.js**: 18.x and 20.x
- **Operating System**: Ubuntu Latest
- **Package Manager**: pnpm

## Security Testing

### OAuth Security Tests

Comprehensive security tests for OAuth callbacks:

- HTTP method validation
- Input validation and sanitization
- CSRF protection
- Authorization code security
- Token exchange validation
- Error handling and logging

### API Security Tests

- Authentication requirements
- Input validation
- Error handling
- Rate limiting (planned)

## Coverage Requirements

### Minimum Coverage Thresholds

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Coverage Exclusions

- Logger implementations
- Test files
- Build artifacts
- Configuration files

## Mocking Strategy

### External Services

- **Google APIs**: OAuth2 and service APIs
- **Slack API**: WebClient and authentication
- **Supabase**: Database and authentication
- **Microsoft Graph**: OAuth and API calls

### Browser APIs

- **ResizeObserver**: Element observation
- **IntersectionObserver**: Scroll detection
- **matchMedia**: Responsive design
- **fetch**: HTTP requests

## Best Practices

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies** consistently

### Test Data

1. **Use factory functions** for test data creation
2. **Keep test data minimal** and focused
3. **Use realistic data** that matches production patterns
4. **Clean up test data** after each test

### Assertions

1. **Use specific assertions** over generic ones
2. **Test both positive and negative cases**
3. **Verify error conditions** and edge cases
4. **Check side effects** and state changes

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
pnpm test src/__tests__/lib/schemas.test.ts

# Run tests matching pattern
pnpm test --grep "OAuth"

# Run tests with verbose output
pnpm test --reporter=verbose
```

### E2E Tests

```bash
# Run tests in headed mode
pnpm test:e2e --headed

# Run specific test
pnpm test:e2e login-flow.spec.ts

# Debug mode
pnpm test:e2e --debug
```

## Performance Testing

### Test Performance

- **Unit tests**: < 1 second per test
- **Integration tests**: < 5 seconds per test
- **E2E tests**: < 30 seconds per test

### CI Performance

- **Total test suite**: < 10 minutes
- **Parallel execution**: Enabled where possible
- **Caching**: Dependencies and build artifacts

## Troubleshooting

### Common Issues

1. **Mock not working**: Check import paths and mock setup
2. **Async test failures**: Ensure proper await usage
3. **Environment variables**: Verify test environment setup
4. **Database tests**: Check Supabase local setup

### Debug Commands

```bash
# Check test environment
pnpm test --run --reporter=verbose

# Verify mocks
pnpm test --run --grep "mock"

# Check coverage
pnpm test:coverage --reporter=html
```

## Future Improvements

### Planned Enhancements

1. **Component Tests**: React Testing Library integration
2. **Visual Regression**: Screenshot testing
3. **Performance Tests**: Load and stress testing
4. **Accessibility Tests**: WCAG compliance testing
5. **API Contract Tests**: OpenAPI schema validation

### Test Automation

1. **Pre-commit hooks**: Run tests before commits
2. **PR validation**: Automated test runs on pull requests
3. **Deployment gates**: Test requirements for production
4. **Monitoring**: Test result tracking and alerting

## Contributing

### Adding New Tests

1. **Follow naming conventions**: `*.test.ts` for unit tests, `*.spec.ts` for E2E
2. **Update coverage**: Ensure new code is covered
3. **Document complex tests**: Add comments for non-obvious logic
4. **Update this guide**: Document new test patterns

### Test Review Checklist

- [ ] Tests cover happy path and error cases
- [ ] Mocks are properly configured
- [ ] Test data is realistic and minimal
- [ ] Assertions are specific and meaningful
- [ ] Tests are isolated and don't depend on each other
- [ ] Performance is acceptable
- [ ] Documentation is updated

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
