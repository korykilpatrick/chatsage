import express, { type Express } from 'express';
import { beforeAll, afterEach, beforeEach } from '@jest/globals';
import { db } from '@db';
import { messages, users, channels, workspaces } from '@db/schema';
import { eq, and, ilike, gte, lte } from 'drizzle-orm';
import searchRouter from '../routes/search';

// Set up the test Express application
export async function setupTestApp(): Promise<Express> {
  const app = express();
  app.use(express.json());

  // Set Content-Type header for all responses
  app.use((_req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Mount the search routes with proper middleware
  app.use('/api/search', searchRouter);

  return app;
}

// Mock Database Interface
interface MockDB {
  users: Map<string, any>;
  verificationTokens: Map<string, string>;
  refreshTokens: Set<string>;
  _lastVerificationToken?: string;
  clear: () => void;
  getLastVerificationToken: () => string | undefined;
}

export function createMockDb(): MockDB {
  const mockDb: MockDB = {
    users: new Map(),
    verificationTokens: new Map(),
    refreshTokens: new Set(),
    _lastVerificationToken: undefined,

    clear() {
      this.users.clear();
      this.verificationTokens.clear();
      this.refreshTokens.clear();
      this._lastVerificationToken = undefined;
    },

    getLastVerificationToken() {
      return this._lastVerificationToken;
    }
  };

  return mockDb;
}

let databaseAvailable = false;

beforeAll(async () => {
  // Mark database as available for testing
  databaseAvailable = true;
  console.log('Database connection established');
});

// Clean up database before each test
beforeEach(async () => {
  if (databaseAvailable) {
    // Order matters due to foreign key constraints
    await db.delete(messages);
    await db.delete(channels);
    await db.delete(workspaces);
    await db.delete(users);
  }
});

// Export flag for tests to check if they should skip database operations
export { databaseAvailable };