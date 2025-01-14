import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Export MSW server instance for tests to use
export const server = setupServer();

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
