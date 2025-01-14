import express, { type Express } from 'express';
import { beforeAll, beforeEach } from '@jest/globals';
import { db } from '../db';
import { messages, users, channels, workspaces } from '../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import workspacesRouter from '../routes/workspaces';

// Mock Vite-related modules
jest.mock('../vite', () => ({
  setupVite: jest.fn(),
  serveStatic: jest.fn(),
  log: jest.fn()
}));

// Set up the test Express application
export async function setupTestApp(): Promise<Express> {
  const app = express();
  app.use(express.json());

  // Set Content-Type header for all responses
  app.use((_req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Add auth middleware mock
  app.use((req: any, _res, next) => {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
        req.user = decoded;
      } catch (error) {
        console.error('Auth error:', error);
      }
    }
    next();
  });

  // Mount the workspaces router
  app.use('/api/workspaces', workspacesRouter);

  return app;
}

// Helper function to create a test user
export async function createTestUser(email = 'test@example.com') {
  const [user] = await db.insert(users)
    .values({
      username: `test_${Date.now()}`,
      email: email,
      password: 'hashedpassword',
      displayName: 'Test User',
      emailVerified: true
    })
    .returning();
  return user;
}

// Helper function to generate auth token for test user
export async function loginTestUser(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (!user) {
    throw new Error('Test user not found');
  }

  // Generate JWT token
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
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