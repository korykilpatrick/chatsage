import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import type { RequestHandler } from 'msw';
import { QueryClient } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react';

// Create MSW server instance
export const server = setupServer(
  // Add your MSW handlers here
  http.get('/api/test', () => {
    return HttpResponse.json({ message: 'MSW is working!' });
  }),

  // Mock user endpoint
  http.get('/api/user', () => {
    return HttpResponse.json(null);
  }),

  // Mock messages endpoint
  http.get('/api/messages', () => {
    return HttpResponse.json([]);
  }),

  // Mock channels endpoint
  http.get('/api/channels', () => {
    return HttpResponse.json([]);
  }),

  // Mock workspaces endpoint
  http.get('/api/workspaces', () => {
    return HttpResponse.json([]);
  })
);

// React Query setup
export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Start MSW Server before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers and cleanup after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up after all tests are done
afterAll(() => server.close());

// Mock data creators
export const createMockUser = (overrides = {}) => ({
  id: 1,
  displayName: 'Test User',
  email: 'test@example.com',
  lastKnownPresence: 'ONLINE',
  statusMessage: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Export mockUser as a constant for consistent testing
export const mockUser = createMockUser();

export const createMockChannel = (overrides = {}) => ({
  id: 1,
  name: 'Test Channel',
  type: 'PUBLIC',
  workspaceId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  archived: false,
  topic: null,
  ...overrides
});

export const createMockWorkspace = (overrides = {}) => ({
  id: 1,
  name: 'Test Workspace',
  ownerId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  archived: false,
  ...overrides
});

export const createMockMessage = (overrides = {}) => ({
  id: 1,
  content: 'Test message',
  userId: 1,
  channelId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  deleted: false,
  ...overrides
});

// Mock socket utilities
export const createMockSocket = () => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn()
});