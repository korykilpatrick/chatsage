import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHookWithClient, createMockSocket } from '../test/setupTests';
import { useSocket } from './use-socket';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn()
}));

// Mock the useUser hook
vi.mock('./use-user', () => ({
  useUser: () => ({
    user: {
      id: 1,
      displayName: 'Test User',
      email: 'test@example.com'
    },
    isLoading: false,
    error: null
  })
}));

describe('useSocket', () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket as unknown as Socket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes socket connection correctly', () => {
    const { result } = renderHookWithClient(() => useSocket());

    expect(io).toHaveBeenCalledWith('', {
      path: '/socket.io',
      autoConnect: true,
      transports: ['websocket']
    });
    expect(result.current).toBeTruthy();
  });

  it('reuses existing socket connection', () => {
    const { result: result1 } = renderHookWithClient(() => useSocket());
    const { result: result2 } = renderHookWithClient(() => useSocket());

    expect(io).toHaveBeenCalledTimes(1);
    expect(result1.current).toBe(result2.current);
  });

  it('disconnects socket on cleanup when no other components are using it', () => {
    const { unmount } = renderHookWithClient(() => useSocket());
    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});