import express, { type Express } from 'express';
import { beforeAll, afterEach, beforeEach } from '@jest/globals';
import { db } from '@db';
import { messages, users, channels, workspaces, files } from '@db/schema';
import { eq, and, ilike, gte, lte } from 'drizzle-orm';
import searchRouter from '../routes/search';
import filesRouter from '../routes/files';

// Set up the test Express application
export async function setupTestApp(): Promise<Express> {
  const app = express();
  app.use(express.json());

  // Set Content-Type header for all responses
  app.use((_req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Add test authentication middleware
  app.use(async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // For testing, we'll consider any non-empty token as valid
      // and attach a test user to the request
      if (token) {
        const [testUser] = await db.select().from(users).where(eq(users.email, 'test@example.com'));
        if (testUser) {
          (req as any).user = testUser;
        }
      }
    }
    next();
  });

  // Mount the search and files routes with proper middleware
  app.use('/api/search', searchRouter);
  app.use('/api/files', filesRouter);

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

  // Create test user if it doesn't exist
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, 'test@example.com')
  });

  if (!existingUser) {
    await db.insert(users).values({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    });
  }

  console.log('Database connection established');
});

// Clean up database before each test
beforeEach(async () => {
  if (databaseAvailable) {
    // Order matters due to foreign key constraints
    await db.delete(messages);
    await db.delete(channels);
    await db.delete(workspaces);
    await db.delete(files);
    // Don't delete the test user as it's needed for auth
  }
});

// Export flag for tests to check if they should skip database operations
export { databaseAvailable };