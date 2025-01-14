// Mock Vite module for testing
const setupVite = jest.fn();
const serveStatic = jest.fn();
const log = jest.fn();

export {
  setupVite,
  serveStatic,
  log
};

export default {
  setupVite,
  serveStatic,
  log
};