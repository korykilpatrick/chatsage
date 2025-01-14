import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUser } from './use-user';
import { createWrapper } from '../test/test-utils';
import { server } from '../test/setupTests';
import { http, HttpResponse } from 'msw';

describe('useUser', () => {
  const mockUser = {
    id: 1,
    displayName: 'Test User',
    email: 'test@example.com',
    lastKnownPresence: 'ONLINE',
    statusMessage: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    server.use(
      http.get('/api/users/me', () => {
        return HttpResponse.json(mockUser);
      })
    );
  });

  it('initializes with null user and loading state', async () => {
    server.use(
      http.get('/api/users/me', () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper()
    });

    // Initial state
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    // Wait for query to settle
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('fetches user data on mount', async () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper()
    });

    // Wait for the query to complete
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('handles login correctly', async () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    // Wait for the user data to be fetched after login
    await vi.waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('handles logout correctly', async () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper()
    });

    // Wait for initial user fetch
    await vi.waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await act(async () => {
      await result.current.logout();
    });

    // Verify logout cleared the user
    await vi.waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });

  it('handles registration correctly', async () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.register({
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User'
      });
    });

    // After registration, user should still be null until they log in
    expect(result.current.user).toBeNull();
  });

  it('handles error states correctly', async () => {
    server.use(
      http.get('/api/users/me', () => {
        return new HttpResponse(
          JSON.stringify({ message: 'Unauthorized' }), 
          { status: 401 }
        );
      })
    );

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper()
    });

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeDefined();
    });
  });
});