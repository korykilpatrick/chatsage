import express, { type Express, Request, Response, NextFunction } from 'express';
import { beforeAll, afterEach, beforeEach } from '@jest/globals';
import { db } from '@db';
import { messages, users, channels, workspaces, files } from '@db/schema';
import { eq } from 'drizzle-orm';
import searchRouter from '../routes/search';
import filesRouter from '../routes/files';
import workspacesRouter from '../routes/workspaces';
import { setupAuth } from '../auth';
import session from 'express-session';

// Set up the test Express application
export async function setupTestApp(): Promise<Express> {
  const app = express();

  // Setup session middleware with test configuration
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: false,
      httpOnly: true
    }
  }));

  app.use(express.json());

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    next(err);
  });

  // Setup authentication
  setupAuth(app);

  // Mount the routes
  app.use('/api/search', searchRouter);
  app.use('/api/files', filesRouter);
  app.use('/api/workspaces', workspacesRouter);

  return app;
}

// Clean up database before each test
beforeEach(async () => {
  // Order matters due to foreign key constraints
  await db.delete(messages);
  await db.delete(channels);
  await db.delete(workspaces);
  await db.delete(files);
  // Don't delete users as they're needed for auth
});

// Create test user for authentication
beforeAll(async () => {
  // Create test user if it doesn't exist
  const testUser = await db.query.users.findFirst({
    where: eq(users.email, 'test@example.com')
  });

  if (!testUser) {
    await db.insert(users).values({
      username: 'testuser',
      email: 'test@example.com',
      password: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // 'password123' hashed
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  console.log('Test environment setup complete');
});

// Export database availability flag
export const databaseAvailable = true;