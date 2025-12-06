import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import UV_Login from '@/components/views/UV_Login';
import { useAppStore } from '@/store/main';

/**
 * E2E Authentication Tests
 * 
 * These tests perform real API calls to the backend server.
 * They test the complete auth flow: register -> logout -> sign-in
 * 
 * Prerequisites:
 * - Backend server must be running at http://localhost:3000
 * - Database must be accessible and initialized
 * 
 * Test Flow:
 * 1. Register a new user with unique email
 * 2. Verify authentication state in Zustand store
 * 3. Logout and verify state is cleared
 * 4. Sign in with the same credentials
 * 5. Verify authentication state is restored
 */

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('UV_Login E2E Auth Flow (Real API)', () => {
  // Generate unique test credentials for each run to avoid email conflicts
  const uniqueEmail = `testuser${Date.now()}@example.com`;
  const testPassword = 'testpass123';
  const testName = 'Test User';

  beforeEach(() => {
    // Clear localStorage to ensure clean state
    localStorage.clear();
    
    // Reset Zustand store to initial unauthenticated state
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
  });

  it('completes full auth flow: register -> logout -> sign-in', async () => {
    // ===== PHASE 1: REGISTRATION =====
    const { unmount } = render(<UV_Login />, { wrapper: Wrapper });

    // Wait for component to be fully rendered
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    });

    // Toggle to register mode
    const toggleButton = screen.getByRole('button', { 
      name: /don't have an account\? sign up/i 
    });
    
    const user = userEvent.setup();
    await user.click(toggleButton);

    // Wait for register mode to be active (name field appears)
    await waitFor(() => {
      expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    });

    // Find form inputs - use flexible selectors
    const nameInput = screen.getByPlaceholderText(/full name/i);
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { 
      name: /create account/i 
    });

    // Ensure inputs are enabled before typing
    await waitFor(() => {
      expect(nameInput).not.toBeDisabled();
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
    });

    // Fill in registration form
    await user.type(nameInput, testName);
    await user.type(emailInput, uniqueEmail);
    await user.type(passwordInput, testPassword);

    // Submit registration
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    // Wait for loading indicator
    await waitFor(() => {
      expect(screen.getByText(/creating account\.\.\./i)).toBeInTheDocument();
    });

    // Wait for registration to complete and store to be updated
    await waitFor(
      () => {
        const state = useAppStore.getState();
        expect(state.authentication_state.authentication_status.is_authenticated).toBe(true);
        expect(state.authentication_state.auth_token).toBeTruthy();
        expect(state.authentication_state.current_user).toBeTruthy();
        expect(state.authentication_state.current_user?.email).toBe(uniqueEmail.toLowerCase());
        expect(state.authentication_state.current_user?.name).toBe(testName);
      },
      { timeout: 20000 }
    );

    // Store token and user for later verification
    const registeredToken = useAppStore.getState().authentication_state.auth_token;
    const registeredUser = useAppStore.getState().authentication_state.current_user;
    
    expect(registeredToken).toBeTruthy();
    expect(registeredUser).toBeTruthy();

    // ===== PHASE 2: LOGOUT =====
    // Call logout action directly
    const logoutUser = useAppStore.getState().logout_user;
    logoutUser();

    // Verify logout cleared the auth state
    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.authentication_state.authentication_status.is_authenticated).toBe(false);
      expect(state.authentication_state.auth_token).toBeNull();
      expect(state.authentication_state.current_user).toBeNull();
    });

    // Unmount and remount to simulate fresh page load
    unmount();
    render(<UV_Login />, { wrapper: Wrapper });

    // ===== PHASE 3: SIGN IN =====
    // Wait for component to be fully rendered (should be in sign-in mode by default)
    await waitFor(() => {
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    // Find form inputs again
    const signInEmailInput = screen.getByPlaceholderText(/email address/i);
    const signInPasswordInput = screen.getByPlaceholderText(/password/i);
    const signInButton = screen.getByRole('button', { 
      name: /sign in/i 
    });

    // Ensure inputs are enabled
    await waitFor(() => {
      expect(signInEmailInput).not.toBeDisabled();
      expect(signInPasswordInput).not.toBeDisabled();
    });

    // Fill in sign-in form with the same credentials
    const signInUser = userEvent.setup();
    await signInUser.type(signInEmailInput, uniqueEmail);
    await signInUser.type(signInPasswordInput, testPassword);

    // Submit sign-in
    await waitFor(() => expect(signInButton).not.toBeDisabled());
    await signInUser.click(signInButton);

    // Wait for loading indicator
    await waitFor(() => {
      expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
    });

    // Wait for sign-in to complete and store to be updated
    await waitFor(
      () => {
        const state = useAppStore.getState();
        expect(state.authentication_state.authentication_status.is_authenticated).toBe(true);
        expect(state.authentication_state.auth_token).toBeTruthy();
        expect(state.authentication_state.current_user).toBeTruthy();
        expect(state.authentication_state.current_user?.email).toBe(uniqueEmail.toLowerCase());
        expect(state.authentication_state.current_user?.name).toBe(testName);
      },
      { timeout: 20000 }
    );

    // Verify we got a token (might be different from registration token)
    const signInToken = useAppStore.getState().authentication_state.auth_token;
    expect(signInToken).toBeTruthy();
    
    // Verify user data is the same
    const signInUser2 = useAppStore.getState().authentication_state.current_user;
    expect(signInUser2?.email).toBe(registeredUser?.email);
    expect(signInUser2?.name).toBe(registeredUser?.name);
  }, 60000); // 60 second timeout for the entire flow

  it('shows error message for invalid login credentials', async () => {
    render(<UV_Login />, { wrapper: Wrapper });

    // Wait for component to be fully rendered
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    });

    // Should be in sign-in mode by default
    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    const user = userEvent.setup();
    
    // Try to sign in with invalid credentials
    await user.type(emailInput, 'invalid@example.com');
    await user.type(passwordInput, 'wrongpassword');

    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    // Wait for error message to appear
    await waitFor(
      () => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Verify auth state is still unauthenticated
    const state = useAppStore.getState();
    expect(state.authentication_state.authentication_status.is_authenticated).toBe(false);
    expect(state.authentication_state.auth_token).toBeNull();
    expect(state.authentication_state.error_message).toBeTruthy();
  }, 30000);

  it('shows error when trying to register with existing email', async () => {
    // First, register a new user
    const existingEmail = `existing${Date.now()}@example.com`;
    
    render(<UV_Login />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    });

    // Toggle to register mode
    const user = userEvent.setup();
    const toggleButton = screen.getByRole('button', { 
      name: /don't have an account\? sign up/i 
    });
    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    });

    // Register first user
    const nameInput = screen.getByPlaceholderText(/full name/i);
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'First User');
    await user.type(emailInput, existingEmail);
    await user.type(passwordInput, 'password123');
    
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    // Wait for registration to complete
    await waitFor(
      () => {
        const state = useAppStore.getState();
        expect(state.authentication_state.authentication_status.is_authenticated).toBe(true);
      },
      { timeout: 20000 }
    );

    // Logout
    const logoutUser = useAppStore.getState().logout_user;
    logoutUser();

    // Clear error
    const clearAuthError = useAppStore.getState().clear_auth_error;
    clearAuthError();

    // Try to register again with the same email
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    });

    const nameInput2 = screen.getByPlaceholderText(/full name/i);
    const emailInput2 = screen.getByPlaceholderText(/email address/i);
    const passwordInput2 = screen.getByPlaceholderText(/password/i);
    const submitButton2 = screen.getByRole('button', { name: /create account/i });

    // Clear fields and re-enter
    await user.clear(nameInput2);
    await user.clear(emailInput2);
    await user.clear(passwordInput2);

    await user.type(nameInput2, 'Second User');
    await user.type(emailInput2, existingEmail);
    await user.type(passwordInput2, 'password456');

    await waitFor(() => expect(submitButton2).not.toBeDisabled());
    await user.click(submitButton2);

    // Wait for error message about duplicate email
    await waitFor(
      () => {
        expect(screen.getByText(/user with this email already exists/i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Verify auth state is still unauthenticated
    const state = useAppStore.getState();
    expect(state.authentication_state.authentication_status.is_authenticated).toBe(false);
    expect(state.authentication_state.auth_token).toBeNull();
  }, 60000);

  it('validates password length requirement', async () => {
    render(<UV_Login />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    });

    // Toggle to register mode
    const user = userEvent.setup();
    const toggleButton = screen.getByRole('button', { 
      name: /don't have an account\? sign up/i 
    });
    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/full name/i);
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Try to register with password less than 6 characters
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, `short${Date.now()}@example.com`);
    await user.type(passwordInput, '12345'); // Only 5 characters

    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    // Wait for error message about password length
    await waitFor(
      () => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Verify auth state is still unauthenticated
    const state = useAppStore.getState();
    expect(state.authentication_state.authentication_status.is_authenticated).toBe(false);
    expect(state.authentication_state.auth_token).toBeNull();
  }, 30000);
});
