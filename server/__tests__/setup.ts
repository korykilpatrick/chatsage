import { beforeAll, afterEach } from '@jest/globals';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

let databaseAvailable = false;

beforeAll(async () => {
  // Ensure database is available and can be connected to
  try {
    await db.query.users.findFirst();
    console.log('Database connection established');
    databaseAvailable = true;
  } catch (error) {
    console.error('Database connection failed:', error);
    // Don't exit process, just mark database as unavailable
    databaseAvailable = false;
  }
});

afterEach(async () => {
  // Only attempt cleanup if database is available
  if (databaseAvailable) {
    try {
      await db.delete(users).where(eq(users.username, 'testuser'));
    } catch (error) {
      console.error('Test cleanup failed:', error);
    }
  }
});

// Export flag for tests to check if they should skip database operations
export { databaseAvailable };