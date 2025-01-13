import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createMockDb } from './setup';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { users } from '@db/schema';

describe('Users API', () => {
  let app: express.Express;
  const mockDb = createMockDb();

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    mockDb.clear();

    // Clean up test data
    await db.delete(users).where(eq(users.username, 'testuser'));
  });

  afterAll(async () => {
    // Final cleanup
    await db.delete(users).where(eq(users.username, 'testuser'));
  });

  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return list of users when users exist', async () => {
      // Create test user in database
      await db.insert(users).values({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        displayName: 'Test User'
      });

      const response = await request(app)
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(expect.objectContaining({
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      }));
      // Password should not be included in response
      expect(response.body[0]).not.toHaveProperty('password');
    });

    it('should filter deactivated users when specified', async () => {
      // Create active and deactivated users
      await db.insert(users).values([
        {
          username: 'active',
          email: 'active@example.com',
          password: 'hashedpassword',
          displayName: 'Active User',
          deactivated: false
        },
        {
          username: 'inactive',
          email: 'inactive@example.com',
          password: 'hashedpassword',
          displayName: 'Inactive User',
          deactivated: true
        }
      ]);

      const response = await request(app)
        .get('/api/users?deactivated=true')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].username).toBe('inactive');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user details for valid ID', async () => {
      // Create test user
      const [user] = await db.insert(users).values({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        displayName: 'Test User'
      }).returning();

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        id: user.id,
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      }));
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/999999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({
        error: 'USER_NOT_FOUND'
      });
    });
  });

  describe('GET /api/users/me', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toEqual({
        error: 'Not authenticated'
      });
    });

    // Note: We'll add more authenticated tests once we implement authentication
  });
});
