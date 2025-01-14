import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { setupServer } from 'msw/node';
import { http } from 'msw';

// Define handlers
const handlers = [
  http.get('/api/user', () => {
    return Response.json({
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    });
  })
];

// Setup MSW Server
const server = setupServer(...handlers);

beforeAll(() => {
  // Start MSW Server before tests
  server.listen();
});

afterAll(() => {
  // Clean up once tests are done
  server.close();
});

afterEach(() => {
  // Reset handlers after each test
  server.resetHandlers();
});