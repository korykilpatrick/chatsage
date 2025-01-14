import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithClient, createMockUser } from '../test/setupTests';
import { useUser } from './use-user';
import { HttpResponse, http } from 'msw';
import { server } from '../test/setupTests';
import { waitFor } from '@testing-library/react';

describe('useUser', () => {
  const mockUser = {
    id: 1,
    displayName: 'Test User',
    email: 'test@example.com',
    lastKnownPresence: 'ONLINE',
    statusMessage: null,
    createdAt: new Date('2024-01-14T12:00:00.000Z'),
    updatedAt: new Date('2024-01-14T12:00:00.000Z')
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
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for query to settle
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    // Check final state
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('loads user data on mount', async () => {
    // Set up mock response before rendering
    server.use(
      http.get('/api/user', () => {
        return HttpResponse.json(mockUser);
      })
    );

    const { result } = renderHookWithClient(() => useUser());

    expect(result.current.isLoading).toBe(true);

    // Wait for the query to settle
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.user).toEqual(mockUser);
      },
      { timeout: 2000 }
    );

    expect(result.current.error).toBeNull();
  });

  it('handles login successfully', async () => {
    server.use(
      http.post('/api/login', () => {
        return HttpResponse.json({ ok: true });
      }),
      http.get('/api/user', () => {
        return HttpResponse.json(mockUser);
      })
    );

    const { result } = renderHookWithClient(() => useUser());

    await waitFor(
      async () => {
        await result.current.login({
          email: 'test@example.com', 
          password: 'password123' 
        });
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.error).toBeNull();
      },
      { timeout: 2000 }
    );
  });

  it('handles registration successfully', async () => {
    server.use(
      http.post('/api/register', () => {
        return HttpResponse.json({ ok: true });
      }),
      http.get('/api/user', () => {
        return HttpResponse.json(mockUser);
      })
    );

    const { result } = renderHookWithClient(() => useUser());

    await waitFor(
      async () => {
        await result.current.register({
          email: 'new@example.com',
          password: 'password123',
          displayName: 'New User'
        });
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.error).toBeNull();
      },
      { timeout: 2000 }
    );
  });

  it('handles logout successfully', async () => {
    // Set up initial logged-in state
    server.use(
      http.get('/api/user', () => {
        return HttpResponse.json(mockUser);
      })
    );

    const { result } = renderHookWithClient(() => useUser());

    // Wait for initial user load
    await waitFor(
      () => {
        expect(result.current.user).toEqual(mockUser);
      },
      { timeout: 2000 }
    );

    // Set up logout response
    server.use(
      http.post('/api/logout', () => {
        return HttpResponse.json({ ok: true });
      }),
      http.get('/api/user', () => {
        return HttpResponse.json(null);
      })
    );

    // Perform logout
    await waitFor(
      async () => {
        await result.current.logout();
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(result.current.user).toBeNull();
        expect(result.current.error).toBeNull();
      },
      { timeout: 2000 }
    );
  });

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    server.use(
      http.post('/api/login', () => {
        return HttpResponse.json(
          { ok: false, error: errorMessage },
          { status: 401 }
        );
      })
    );

    const { result } = renderHookWithClient(() => useUser());

    let loginError: Error | null = null;
    await waitFor(
      async () => {
        try {
          await result.current.login({
            email: 'wrong@example.com',
            password: 'wrongpassword'
          });
        } catch (e) {
          loginError = e as Error;
        }
      },
      { timeout: 2000 }
    );

    expect(loginError?.message).toBe(errorMessage);
    expect(result.current.user).toBeNull();
  });
});