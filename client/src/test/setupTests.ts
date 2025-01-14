import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import type { RequestHandler } from 'msw';

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

// Start MSW Server before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());

// Custom test utilities
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
  archived: false,
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});