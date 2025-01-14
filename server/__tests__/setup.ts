import express, { type Express } from 'express';
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

  // Setup session before other middleware
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  app.use(express.json());

  // Set Content-Type header for all responses
  app.use((_req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Setup authentication
  setupAuth(app);

  // Mount the routes with proper middleware
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
      password: 'password123',
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  console.log('Test environment setup complete');
});

// Export database availability flag
export const databaseAvailable = true;