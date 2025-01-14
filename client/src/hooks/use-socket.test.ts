import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSocket } from './use-socket';
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  }))
}));

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes socket connection correctly', () => {
    renderHook(() => useSocket());
    expect(io).toHaveBeenCalledWith('', {
      path: '/socket.io',
      autoConnect: true,
      transports: ['websocket']
    });
  });

  it('reuses existing socket connection', () => {
    const { result: result1 } = renderHook(() => useSocket());
    const { result: result2 } = renderHook(() => useSocket());

    expect(io).toHaveBeenCalledTimes(1);
    expect(result1.current).toBe(result2.current);
  });

  it('disconnects socket on cleanup', () => {
    const mockDisconnect = vi.fn();
    vi.mocked(io).mockReturnValue({
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: mockDisconnect
    } as any);

    const { unmount } = renderHook(() => useSocket());
    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
