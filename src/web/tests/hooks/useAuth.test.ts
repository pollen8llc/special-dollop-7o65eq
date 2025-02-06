/**
 * Comprehensive test suite for useAuth custom hook
 * Tests authentication state management, security features, and error handling
 * @version 1.0.0
 */

import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { useAuth } from '../../app/hooks/useAuth';
import {
  AuthState,
  AuthUser,
  AuthError,
  OAuthProvider,
  UserRole
} from '../../app/types/auth.types';

// Mock Remix's useNavigate
jest.mock('@remix-run/react', () => ({
  useNavigate: () => jest.fn()
}));

// Mock Clerk authentication service
jest.mock('../../app/lib/clerk', () => ({
  clerk: {
    user: jest.fn(),
    setSession: jest.fn()
  },
  signInWithLinkedIn: jest.fn(),
  signOut: jest.fn(),
  validateSession: jest.fn(),
  refreshToken: jest.fn()
}));

describe('useAuth Hook', () => {
  // Mock user data
  const mockUser: AuthUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: 'https://example.com/avatar.jpg',
    roles: [UserRole.USER],
    lastLoginAt: new Date(),
    metadata: {}
  };

  // Mock error
  const mockError: AuthError = {
    code: 'AUTH_ERROR',
    message: 'Authentication failed',
    status: 401,
    timestamp: new Date(),
    details: {}
  };

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle successful authentication', async () => {
    const { result } = renderHook(() => useAuth());

    // Mock successful sign in
    (signInWithLinkedIn as jest.Mock).mockResolvedValueOnce(undefined);
    
    await act(async () => {
      await result.current.signIn();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle authentication failure', async () => {
    const { result } = renderHook(() => useAuth());

    // Mock failed sign in
    (signInWithLinkedIn as jest.Mock).mockRejectedValueOnce(new Error('Auth failed'));

    await act(async () => {
      try {
        await result.current.signIn();
      } catch (error) {
        // Error should be caught
      }
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.code).toBe('SIGN_IN_ERROR');
  });

  it('should enforce rate limiting', async () => {
    const { result } = renderHook(() => useAuth());

    // Attempt multiple rapid sign-ins
    for (let i = 0; i < 4; i++) {
      await act(async () => {
        try {
          await result.current.signIn();
        } catch (error) {
          // Expected error on 4th attempt
          if (i === 3) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toContain('Too many sign-in attempts');
          }
        }
      });
    }
  });

  it('should handle session timeout', async () => {
    const { result } = renderHook(() => useAuth());

    // Mock initial authentication
    (signInWithLinkedIn as jest.Mock).mockResolvedValueOnce(undefined);
    
    await act(async () => {
      await result.current.signIn();
    });

    // Mock session timeout
    (validateSession as jest.Mock).mockResolvedValueOnce(false);

    // Advance timers to trigger session check
    act(() => {
      jest.advanceTimersByTime(60000); // 1 minute
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  it('should handle token refresh', async () => {
    const { result } = renderHook(() => useAuth());

    // Mock successful token refresh
    (refreshToken as jest.Mock).mockResolvedValueOnce('new-token');

    await act(async () => {
      await result.current.refreshSession();
    });

    expect(refreshToken).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('should handle sign out', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(signOut).toHaveBeenCalled();
  });

  it('should handle concurrent authentication attempts', async () => {
    const { result } = renderHook(() => useAuth());

    // Simulate concurrent sign-in attempts
    const attempts = [
      result.current.signIn(),
      result.current.signIn(),
      result.current.signIn()
    ];

    await act(async () => {
      await Promise.all(attempts);
    });

    // Only one sign-in attempt should succeed
    expect(signInWithLinkedIn).toHaveBeenCalledTimes(1);
  });

  it('should clean up intervals on unmount', () => {
    const { result, unmount } = renderHook(() => useAuth());

    // Mock successful authentication
    act(() => {
      (result.current as any).setAuthState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
    });

    // Unmount should clear intervals
    unmount();

    // Advance timers
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // No session checks should occur after unmount
    expect(validateSession).not.toHaveBeenCalled();
  });

  it('should handle network errors during authentication', async () => {
    const { result } = renderHook(() => useAuth());

    // Mock network error
    (signInWithLinkedIn as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      try {
        await result.current.signIn();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    expect(result.current.error?.code).toBe('SIGN_IN_ERROR');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should validate session state consistency', async () => {
    const { result } = renderHook(() => useAuth());

    // Mock successful authentication
    await act(async () => {
      (signInWithLinkedIn as jest.Mock).mockResolvedValueOnce(undefined);
      await result.current.signIn();
    });

    // Validate session state
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Mock session invalidation
    await act(async () => {
      (validateSession as jest.Mock).mockResolvedValueOnce(false);
      await result.current.validateCurrentSession();
    });

    // Session should be cleared
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});