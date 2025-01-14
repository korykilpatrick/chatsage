import { vi } from 'vitest';

export const createMockSocket = () => ({
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
  connected: true,
  id: 'mock-socket-id'
});

const mockSocket = createMockSocket();

// Create a mock implementation for socket.io-client
export const mockIo = vi.fn(() => mockSocket);

// Export both for flexibility in testing
export { mockSocket };
