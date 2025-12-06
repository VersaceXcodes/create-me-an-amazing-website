# E2E Authentication Tests

This document describes the E2E authentication tests for the Vite+React+TypeScript application.

## Overview

The E2E tests in `src/__tests__/auth.e2e.test.tsx` test the complete authentication flow using **real API calls** to the backend server (no mocking). These tests verify the integration between the React frontend, Zustand state management, and the Express backend.

## Test Coverage

### 1. Full Authentication Flow
**Test:** `completes full auth flow: register -> logout -> sign-in`

This is the main E2E test that validates the complete user journey:
- **Registration**: Creates a new user with a unique timestamped email
- **Verification**: Checks that the Zustand store reflects authenticated state
- **Logout**: Clears authentication state
- **Sign-in**: Logs in with the same credentials
- **Verification**: Confirms authentication state is restored

### 2. Invalid Login Credentials
**Test:** `shows error message for invalid login credentials`

Validates error handling when a user attempts to sign in with incorrect credentials:
- Attempts login with non-existent email and wrong password
- Verifies error message is displayed
- Confirms auth state remains unauthenticated

### 3. Duplicate Email Registration
**Test:** `shows error when trying to register with existing email`

Tests database constraint enforcement:
- Registers a user successfully
- Attempts to register again with the same email
- Verifies error message about duplicate email
- Confirms auth state remains unauthenticated

### 4. Password Length Validation
**Test:** `validates password length requirement`

Verifies backend validation for password requirements:
- Attempts registration with password < 6 characters
- Verifies error message about password length
- Confirms registration is rejected

## Prerequisites

Before running the tests, ensure:

1. **Backend Server Running**
   ```bash
   cd backend
   npm run dev  # Server should be running on http://localhost:3000
   ```

2. **Database Accessible**
   - PostgreSQL database must be running and accessible
   - Database should be initialized with the users table
   - Connection details configured in backend `.env` file

3. **Dependencies Installed**
   ```bash
   cd vitereact
   npm install
   ```

## Running the Tests

### Run All Tests
```bash
npm test
```

### Run E2E Auth Tests Only
```bash
npm run test:e2e
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with UI
```bash
npm run test:ui
```

## Configuration

### Environment Variables
The tests use the following environment variable defined in `.env.test`:
```
VITE_API_BASE_URL=http://localhost:3000
```

This is also configured in `vitest.config.ts` to ensure the tests connect to the correct backend server.

### Vitest Configuration
Key settings in `vitest.config.ts`:
- **Environment**: `jsdom` (for DOM testing)
- **Globals**: Enabled (for describe, it, expect without imports)
- **Setup Files**: `./src/test/setup.ts` (imports @testing-library/jest-dom)
- **Timeout**: 30 seconds (for async operations)
- **Includes**: Both `src/**/*.{test,spec}.{ts,tsx}` and `src/__tests__/**/*.{test,spec}.{ts,tsx}`

### Path Aliases
The tests use the `@/` path alias configured in both:
- `tsconfig.json`: Maps `@/*` to `./src/*`
- `vitest.config.ts`: Resolves `@` to `./src` directory
- `vite.config.ts`: Same alias configuration

## Test Architecture

### No Mocking
These tests perform **real API calls** to the backend server. This provides:
- True end-to-end validation
- Confidence that frontend and backend integrate correctly
- Verification of actual database operations

### Store Testing
Tests directly inspect the Zustand store state using:
```typescript
const state = useAppStore.getState();
expect(state.authentication_state.authentication_status.is_authenticated).toBe(true);
```

### Unique Test Data
Each test run generates unique email addresses using timestamps:
```typescript
const uniqueEmail = `testuser${Date.now()}@example.com`;
```
This prevents database conflicts when tests run multiple times.

### Resilient Selectors
The tests use flexible regex patterns for finding UI elements:
- `/email address|email/i` - Matches various email label formats
- `/password/i` - Matches password fields
- `/sign in|log in|register|sign up|create/i` - Matches various button texts

## Test Data

### Default Test Credentials
```typescript
const uniqueEmail = `testuser${Date.now()}@example.com`;
const testPassword = 'testpass123';
const testName = 'Test User';
```

### Custom Test Users
To test with specific credentials, you can modify the test file or set environment variables in `.env.test`:
```
VITE_REAL_TEST_EMAIL=your-test-email@example.com
VITE_REAL_TEST_PASSWORD=your-test-password
```
(Note: Current tests don't use these, but they're available for future tests)

## Troubleshooting

### Backend Not Running
**Error:** Connection refused or timeout errors

**Solution:** Ensure the backend server is running:
```bash
cd backend
npm run dev
```

### Database Connection Issues
**Error:** Database connection errors

**Solution:** 
1. Check PostgreSQL is running
2. Verify `.env` in backend has correct database credentials
3. Ensure database is initialized with the users table

### Port Already in Use
**Error:** Backend port 3000 already in use

**Solution:** 
1. Kill the process using port 3000
2. Or change the port in backend and update `.env.test` and `vitest.config.ts`

### Test Timeouts
**Error:** Tests timing out

**Solution:**
1. Check backend server is responding
2. Increase timeout in test:
   ```typescript
   it('test name', async () => {
     // test code
   }, 60000); // 60 seconds
   ```

### Zustand Store State Issues
**Error:** Store state not updating

**Solution:**
1. Ensure `localStorage.clear()` in `beforeEach`
2. Verify store reset in `beforeEach`:
   ```typescript
   useAppStore.setState({
     authentication_state: {
       current_user: null,
       auth_token: null,
       authentication_status: {
         is_authenticated: false,
         is_loading: false,
       },
       error_message: null,
     },
   });
   ```

## File Structure

```
vitereact/
├── src/
│   ├── __tests__/
│   │   └── auth.e2e.test.tsx       # E2E auth tests
│   ├── components/
│   │   └── views/
│   │       └── UV_Login.tsx        # Login/Register component
│   ├── store/
│   │   └── main.tsx                # Zustand store with auth actions
│   └── test/
│       └── setup.ts                # Test setup (jest-dom)
├── .env.test                        # Test environment variables
├── vitest.config.ts                 # Vitest configuration
├── package.json                     # Test scripts
└── TEST_README.md                   # This file
```

## Best Practices

1. **Clean State**: Always clear localStorage and reset store in `beforeEach`
2. **Unique Data**: Use timestamp-based emails to avoid conflicts
3. **Flexible Selectors**: Use regex patterns to handle UI variations
4. **Real APIs**: Don't mock the backend; test real integration
5. **Error Handling**: Test both success and error scenarios
6. **Timeouts**: Set appropriate timeouts for network operations
7. **Store Assertions**: Verify Zustand state, not just UI

## References

- **Vitest**: https://vitest.dev/
- **Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Zustand**: https://github.com/pmndrs/zustand
- **User Event**: https://testing-library.com/docs/user-event/intro/
