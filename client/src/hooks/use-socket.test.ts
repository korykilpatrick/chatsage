import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSocket } from './use-socket';
import { createWrapper } from '../test/test-utils';
import { mockSocket, mockIo } from '../test/mocks/socket-mock';

// Mock socket.io-client before any imports
vi.mock('socket.io-client', () => ({
  io: () => mockSocket
}));

// Mock use-user hook
vi.mock('./use-user', () => ({
  useUser: () => ({
    user: { id: 1, displayName: 'Test User' },
    isLoading: false,
    error: null
  })
}));

describe('useSocket', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  it('initializes socket connection correctly', () => {
    renderHook(() => useSocket(), {
      wrapper: createWrapper()
    });

    // Verify socket initialization
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });

  it('reuses existing socket connection', () => {
    const { result: result1 } = renderHook(() => useSocket(), {
      wrapper: createWrapper()
    });
    const { result: result2 } = renderHook(() => useSocket(), {
      wrapper: createWrapper()
    });

    // Both hooks should return the same socket instance
    expect(result1.current).toBe(result2.current);
  });

  it('disconnects socket on cleanup', () => {
    const { unmount } = renderHook(() => useSocket(), {
      wrapper: createWrapper()
    });

    unmount();

    // Verify disconnect was called
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('handles socket events correctly', () => {
    renderHook(() => useSocket(), {
      wrapper: createWrapper()
    });

    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
    const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];

    // Verify handlers are functions
    expect(typeof connectHandler).toBe('function');
    expect(typeof disconnectHandler).toBe('function');
  });
});