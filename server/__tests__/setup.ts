import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

beforeAll(async () => {
  // Ensure database is available
  try {
    await db.query.users.findFirst();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
});

afterEach(async () => {
  // Clean up test data after each test
  try {
    await db.delete(users).where(eq(users.username, 'testuser'));
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
});