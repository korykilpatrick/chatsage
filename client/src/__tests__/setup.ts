import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'jest';
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

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
