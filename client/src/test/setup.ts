import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => {
  // Start the MSW server before all tests
  server.listen();
});

afterEach(() => {
  // Reset any request handlers added during the tests
  server.resetHandlers();
});

afterAll(() => {
  // Clean up after the tests are finished
  server.close();
});
