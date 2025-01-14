import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { messages, channels, users } from '@db/schema';
import messagesRouter from '../routes/messages';

describe('Messages API', () => {
  let app: express.Express;
  let testUser: any;
  let testChannel: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Set Content-Type header for all responses
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

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
      // Mount the messages router without auth middleware first
      app.use('/api/channels', messagesRouter);

      const response = await request(app)
        .get(`/api/channels/${testChannel.id}/messages`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });

    it('should return empty array when no messages exist', async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      // Then mount the router
      app.use('/api/channels', messagesRouter);

      const response = await request(app)
        .get(`/api/channels/${testChannel.id}/messages`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return list of messages when messages exist', async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      // Then mount the router
      app.use('/api/channels', messagesRouter);

      // Create test message with timestamp
      const [message] = await db.insert(messages).values({
        content: 'Test message',
        channelId: testChannel.id,
        userId: testUser.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
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
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      // Then mount the router
      app.use('/api/channels', messagesRouter);

      // Create multiple test messages with different timestamps
      const messagePromises = Array.from({ length: 25 }, (_, i) => {
        const date = new Date();
        date.setMinutes(date.getMinutes() - i); // Each message 1 minute apart
        return db.insert(messages).values({
          content: `Test message ${i + 1}`,
          channelId: testChannel.id,
          userId: testUser.id,
          deleted: false,
          createdAt: date,
          updatedAt: date
        }).returning();
      });

      await Promise.all(messagePromises);

      const response = await request(app)
        .get(`/api/channels/${testChannel.id}/messages?limit=10&offset=0`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(10);
      // Most recent messages should appear first
      expect(response.body[0].content).toBe('Test message 1');
    });

    it('should handle invalid channel ID', async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      // Then mount the router
      app.use('/api/channels', messagesRouter);

      const response = await request(app)
        .get('/api/channels/999/messages')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Channel not found');
    });
  });

  describe('POST /api/channels/:channelId/messages', () => {
    beforeEach(() => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      // Then mount the router
      app.use('/api/channels', messagesRouter);
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
        userId: testUser.id,
        deleted: false
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