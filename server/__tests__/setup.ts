import { beforeAll, afterEach } from '@jest/globals';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

beforeAll(async () => {
  // Ensure database is available and can be connected to
  try {
    await db.query.users.findFirst();
    console.log('Database connection established');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); // Exit if we can't connect to the database
  }
});

afterEach(async () => {
  // Clean up test data after each test
  try {
    await db.delete(users).where(eq(users.username, 'testuser'));
  } catch (error) {
    console.error('Test cleanup failed:', error);
  }
});