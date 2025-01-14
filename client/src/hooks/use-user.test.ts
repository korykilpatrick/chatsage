import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithClient } from '../test/setupTests';
import { useUser } from './use-user';
import { HttpResponse, http } from 'msw';
import { server } from '../test/setupTests';
import { act } from '@testing-library/react';

describe('useUser', () => {
  const mockUser = {
    id: 1,
    displayName: 'Test User',
    email: 'test@example.com',
    lastKnownPresence: 'ONLINE',
    statusMessage: null,
    createdAt: new Date('2024-01-14T12:00:00Z'),
    updatedAt: new Date('2024-01-14T12:00:00Z')
  };

  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('/api/user', () => {
        return HttpResponse.json(null);
      })
    );
  });

  it('returns null user and isLoading=true initially', async () => {
    const { result } = renderHookWithClient(() => useUser());

    // Initial state check
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to settle
    await act(async () => {
      await vi.dynamicImportSettled();
    });
  });

  it('loads user data on mount', async () => {
    server.use(
      http.get('/api/user', () => {
        return HttpResponse.json(mockUser);
      })
    );

    const { result } = renderHookWithClient(() => useUser());

    await act(async () => {
      await vi.dynamicImportSettled();
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('handles login successfully', async () => {
    server.use(
      http.post('/api/auth/login', async () => {
        return HttpResponse.json({ token: 'mock-token' });
      }),
      http.get('/api/user', () => {
        return HttpResponse.json(mockUser);
      })
    );

    const { result } = renderHookWithClient(() => useUser());

    await act(async () => {
      await result.current.login({ 
        email: 'test@example.com', 
        password: 'password123' 
      });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('handles registration successfully', async () => {
    server.use(
      http.post('/api/auth/register', async () => {
        return HttpResponse.json({ message: 'Registration successful' });
      })
    );

    const { result } = renderHookWithClient(() => useUser());

    await act(async () => {
      await result.current.register({
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User'
      });
    });

    expect(result.current.error).toBeNull();
  });

  it('handles logout successfully', async () => {
    server.use(
      http.post('/api/auth/logout', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    const { result } = renderHookWithClient(() => useUser());

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    server.use(
      http.post('/api/auth/login', () => {
        return HttpResponse.json(
          { message: errorMessage },
          { status: 401 }
        );
      })
    );

    const { result } = renderHookWithClient(() => useUser());

    await act(async () => {
      await result.current.login({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.user).toBeNull();
  });
});