import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import type { RequestHandler } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react';
import { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import * as React from 'react';

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
  http.get('/api/channels/:channelId/messages', () => {
    const mockMessages = [
      {
        id: 1,
        content: 'Hello world',
        userId: 1,
        channelId: 1,
        createdAt: new Date('2024-01-14T12:00:00Z'),
        updatedAt: new Date('2024-01-14T12:00:00Z'),
        deleted: false
      },
      {
        id: 2,
        content: 'How are you?',
        userId: 2,
        channelId: 1,
        createdAt: new Date('2024-01-14T12:01:00Z'),
        updatedAt: new Date('2024-01-14T12:01:00Z'),
        deleted: false
      }
    ];
    return HttpResponse.json(mockMessages);
  }),

  // Mock channels endpoint
  http.get('/api/channels', () => {
    const mockChannels = [
      { id: 1, name: 'General', workspaceId: 1 },
      { id: 2, name: 'Random', workspaceId: 1 }
    ];
    return HttpResponse.json(mockChannels);
  }),

  // Mock workspaces endpoint
  http.get('/api/workspaces', () => {
    const mockWorkspaces = [
      { id: 1, name: 'ChatSage', ownerId: 1 }
    ];
    return HttpResponse.json(mockWorkspaces);
  })
);

// React Query setup
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
});

interface WrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export const TestWrapper = ({ children, queryClient = createTestQueryClient() }: WrapperProps) => {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  );
};

// Custom renderHook with wrapper
export function renderHookWithClient<Result, Props>(
  render: (initialProps: Props) => Result,
  options?: { wrapper?: React.ComponentType<any> }
) {
  const queryClient = createTestQueryClient();
  const wrapper = options?.wrapper
    ? ({ children }: { children: ReactNode }) => 
        React.createElement(TestWrapper, { queryClient }, 
          React.createElement(options.wrapper!, null, children)
        )
    : ({ children }: { children: ReactNode }) => 
        React.createElement(TestWrapper, { queryClient }, children);

  return renderHook(render, { wrapper });
}

// Global setup
beforeAll(() => {
  // Start MSW Server before tests
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers and cleanup after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up after all tests are done
afterAll(() => {
  server.close();
});

// Mock data creators
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

// Mock socket utilities
export const createMockSocket = () => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn()
});