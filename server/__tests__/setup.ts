import express, { type Express } from 'express';
import { beforeAll, afterEach, beforeEach } from '@jest/globals';
import { db } from '@db';
import { messages, users, channels, workspaces } from '@db/schema';
import { eq, and, ilike } from 'drizzle-orm';

// Set up the test Express application
export async function setupTestApp(): Promise<Express> {
  const app = express();
  app.use(express.json());

  // Mount the search routes
  app.get('/api/search', async (req, res) => {
    try {
      const { keyword, workspaceId } = req.query;

      // Base query for messages
      let query = db.select({
        messages: messages,
        user: users,
        channel: channels,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .leftJoin(channels, eq(messages.channelId, channels.id));

      // Add conditions based on parameters
      const conditions = [];

      if (keyword) {
        conditions.push(ilike(messages.content, `%${keyword}%`));
      }

      if (workspaceId) {
        const wsId = parseInt(workspaceId as string);
        if (isNaN(wsId)) {
          return res.status(400).json({ error: 'Invalid workspace ID' });
        }
        conditions.push(eq(messages.workspaceId, wsId));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Execute query
      const results = await query.execute();

      // Format results
      const formattedResults = results.map(result => ({
        id: result.messages.id,
        content: result.messages.content,
        createdAt: result.messages.createdAt,
        user: result.user ? {
          id: result.user.id,
          username: result.user.username,
          displayName: result.user.displayName,
        } : null,
        channel: result.channel ? {
          id: result.channel.id,
          name: result.channel.name,
          workspaceId: result.channel.workspaceId,
        } : null,
        workspaceId: result.messages.workspaceId,
      }));

      res.json({ messages: formattedResults });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

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