import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import type { RequestHandler } from 'msw';
import { QueryClient } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react';
import { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
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
  })
);

// React Query setup
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    }
  },
  logger: {
    log: console.log,
    warn: console.warn,
    error: () => {}
  }
});

interface WrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export const TestWrapper = ({ children, queryClient = createTestQueryClient() }: WrapperProps) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

// Custom renderHook with wrapper
export function renderHookWithClient<Result, Props>(
  render: (initialProps: Props) => Result,
  options?: { wrapper?: React.ComponentType<any> }
) {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    options?.wrapper ? (
      <TestWrapper queryClient={queryClient}>
        <options.wrapper>
          {children}
        </options.wrapper>
      </TestWrapper>
    ) : (
      <TestWrapper queryClient={queryClient}>
        {children}
      </TestWrapper>
    )
  );

  return renderHook(render, { wrapper });
}

// Mock data creators
export const createMockUser = (overrides = {}) => ({
  id: 1,
  displayName: 'Test User',
  email: 'test@example.com',
  lastKnownPresence: 'ONLINE',
  statusMessage: null,
  createdAt: new Date('2024-01-14T12:00:00.000Z'),
  updatedAt: new Date('2024-01-14T12:00:00.000Z'),
  ...overrides
});

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

export const createMockSocket = () => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn()
});

// Global setup
beforeAll(() => {
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