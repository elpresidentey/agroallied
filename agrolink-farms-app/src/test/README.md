# Testing Infrastructure

This directory contains the testing infrastructure for the AgroLink Farms authentication system refactor.

## Overview

The testing infrastructure provides:

1. **Jest Configuration** - TypeScript and React Testing Library support
2. **Fast-check Integration** - Property-based testing library
3. **MSW Setup** - API mocking (with fallback for compatibility issues)
4. **Test Utilities** - Helper functions and arbitraries for auth testing
5. **Polyfills** - Node.js environment compatibility

## Directory Structure

```
src/test/
├── README.md                 # This file
├── setup.test.ts            # Infrastructure verification tests
├── infrastructure.test.tsx   # Integration tests
├── polyfills.js             # Node.js polyfills for Jest
├── mocks/
│   ├── handlers.ts          # MSW request handlers
│   ├── server.ts            # MSW server setup (original)
│   ├── simple-server.ts     # MSW server setup (with error handling)
│   └── mock-api.ts          # Fallback API mocking utilities
└── utils/
    ├── index.ts             # Utility exports
    ├── auth-helpers.ts      # Authentication test helpers
    ├── property-helpers.ts  # Fast-check arbitraries
    └── render-helpers.tsx   # React Testing Library helpers
```

## Usage

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/test/setup.test.ts
```

### Property-Based Testing

Use fast-check for property-based tests:

```typescript
import * as fc from 'fast-check'
import { userArbitrary, propertyTestConfig } from '@/test/utils/property-helpers'

test('user property test', () => {
  fc.assert(
    fc.property(userArbitrary, (user) => {
      // Test that holds for all users
      expect(user.email).toContain('@')
      return true
    }),
    propertyTestConfig // Uses 100 iterations
  )
})
```

### Auth Testing Helpers

Use auth helpers for consistent test data:

```typescript
import { createMockUser, createMockSession } from '@/test/utils/auth-helpers'

test('auth test', () => {
  const user = createMockUser({ role: 'seller' })
  const session = createMockSession({ user })
  
  // Test with mock data
})
```

### Component Testing

Use React Testing Library with custom render:

```typescript
import { render, screen } from '@/test/utils/render-helpers'

test('component test', () => {
  render(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

### API Mocking

MSW is configured but may have compatibility issues. Use the fallback MockAPI:

```typescript
import { MockAPI } from '@/test/mocks/mock-api'

test('api test', () => {
  MockAPI.mockResponse('/api/users', {
    status: 200,
    data: { users: [] }
  })
  
  // Test API calls
})
```

## Configuration

### Jest Configuration

Located in `jest.config.js`:
- Uses Next.js Jest configuration
- TypeScript support via ts-jest
- React Testing Library setup
- Module path mapping (`@/` → `src/`)
- Coverage collection from `src/` directory

### Property Test Configuration

Default configuration in `property-helpers.ts`:
- 100 iterations per test (minimum required)
- Verbose output enabled
- Custom arbitraries for auth domain objects

### MSW Configuration

MSW is configured with error handling:
- Falls back gracefully if MSW fails to load
- Provides console warnings for debugging
- Uses bypass mode for unhandled requests

## Available Arbitraries

Fast-check arbitraries for auth testing:

- `emailArbitrary` - Valid email addresses
- `roleArbitrary` - User roles (buyer, seller, admin)
- `userArbitrary` - Complete user objects
- `sessionArbitrary` - Session objects with tokens
- `authErrorArbitrary` - Authentication error objects
- `passwordArbitrary` - Valid passwords (8-100 chars)
- `userIdArbitrary` - UUID format user IDs

## Available Helpers

Authentication test helpers:

- `createMockUser(overrides?)` - Create mock user with optional overrides
- `createMockSession(overrides?)` - Create mock session with optional overrides
- `createMockAuthError(code, message)` - Create mock auth error
- `createMockSupabaseClient()` - Create mock Supabase client
- `mockLocalStorage()` - Mock localStorage for tests
- `mockCookies()` - Mock cookies for tests
- `wait(ms)` - Utility for async test delays

## Troubleshooting

### MSW Issues

If MSW fails to load (common with ES module compatibility):
1. Tests will show warning but continue to pass
2. Use MockAPI fallback for API mocking
3. Check console for specific error messages

### TypeScript Issues

If TypeScript compilation fails:
1. Check `tsconfig.json` includes test files
2. Verify `@types/jest` is installed
3. Check module path mappings in Jest config

### React Testing Library Issues

If component tests fail:
1. Ensure `@testing-library/jest-dom` is imported in setup
2. Check that components are wrapped with providers if needed
3. Use `screen.debug()` to inspect rendered output

## Best Practices

1. **Property Tests**: Use for universal properties that should hold for all inputs
2. **Unit Tests**: Use for specific examples and edge cases
3. **Integration Tests**: Use for testing component interactions
4. **Mock Data**: Use helpers for consistent test data
5. **Test Isolation**: Each test should be independent
6. **Descriptive Names**: Test names should describe what is being tested
7. **Minimal Setup**: Keep test setup as simple as possible

## Future Improvements

1. Fix MSW compatibility issues with newer versions
2. Add more domain-specific arbitraries
3. Create custom matchers for auth assertions
4. Add visual regression testing setup
5. Integrate with CI/CD pipeline for automated testing