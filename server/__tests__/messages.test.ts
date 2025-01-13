import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { messages, channels, users } from '@db/schema';

describe('Messages API', () => {
  let app: express.Express;
  let testUser: any;
  let testChannel: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Clean up test data
    await db.delete(messages);
    await db.delete(channels);
    await db.delete(users);

    // Create test user
    [testUser] = await db.insert(users).values({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      displayName: 'Test User'
    }).returning();

    // Create test channel
    [testChannel] = await db.insert(channels).values({
      name: 'test-channel',
      type: 'PUBLIC'
    }).returning();
  });

  afterAll(async () => {
    // Final cleanup
    await db.delete(messages);
    await db.delete(channels);
    await db.delete(users);
  });

  describe('GET /api/channels/:channelId/messages', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get(`/api/channels/${testChannel.id}/messages`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });

    it('should return empty array when no messages exist', async () => {
      // Mock authenticated user
      app.use((req, res, next) => {
        (req as any).user = testUser;
        next();
      });

      const response = await request(app)
        .get(`/api/channels/${testChannel.id}/messages`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return list of messages when messages exist', async () => {
      // Mock authenticated user
      app.use((req, res, next) => {
        (req as any).user = testUser;
        next();
      });

      // Create test message
      const [message] = await db.insert(messages).values({
        content: 'Test message',
        channelId: testChannel.id,
        userId: testUser.id
      }).returning();

      const response = await request(app)
        .get(`/api/channels/${testChannel.id}/messages`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(expect.objectContaining({
        id: message.id,
        content: 'Test message',
        channelId: testChannel.id,
        userId: testUser.id
      }));
    });

    it('should support pagination', async () => {
      // Mock authenticated user
      app.use((req, res, next) => {
        (req as any).user = testUser;
        next();
      });

      // Create multiple test messages
      const messages = await Promise.all(
        Array.from({ length: 25 }, (_, i) => 
          db.insert(messages).values({
            content: `Test message ${i + 1}`,
            channelId: testChannel.id,
            userId: testUser.id
          }).returning()
        )
      );

      const response = await request(app)
        .get(`/api/channels/${testChannel.id}/messages?limit=10&offset=0`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(10);
      expect(response.body[0]).toEqual(expect.objectContaining({
        content: 'Test message 25', // Most recent first
      }));
    });

    it('should handle invalid channel ID', async () => {
      // Mock authenticated user
      app.use((req, res, next) => {
        (req as any).user = testUser;
        next();
      });

      const response = await request(app)
        .get('/api/channels/999/messages')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Channel not found');
    });
  });

  describe('POST /api/channels/:channelId/messages', () => {
    beforeEach(() => {
      // Mock authenticated user for all tests in this describe block
      app.use((req, res, next) => {
        (req as any).user = testUser;
        next();
      });
    });

    it('should create a new message', async () => {
      const messageData = {
        content: 'New test message'
      };

      const response = await request(app)
        .post(`/api/channels/${testChannel.id}/messages`)
        .send(messageData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({
        content: messageData.content,
        channelId: testChannel.id,
        userId: testUser.id
      }));

      // Verify message was actually created in database
      const [dbMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, response.body.id));

      expect(dbMessage).toBeTruthy();
      expect(dbMessage.content).toBe(messageData.content);
    });

    it('should return 400 for empty message content', async () => {
      const response = await request(app)
        .post(`/api/channels/${testChannel.id}/messages`)
        .send({ content: '' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Message content cannot be empty');
    });

    it('should return 404 for invalid channel ID', async () => {
      const response = await request(app)
        .post('/api/channels/999/messages')
        .send({ content: 'Test message' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Channel not found');
    });
  });
});
