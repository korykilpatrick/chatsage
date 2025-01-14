import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { messages as messagesTable, channels, users } from '@db/schema';
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
    await db.delete(messagesTable);
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

  afterEach(async () => {
    // Final cleanup
    await db.delete(messagesTable);
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

      expect(response.body).toHaveProperty('messages');
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages).toHaveLength(0);
    });

    it('should filter messages by timestamp range', async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      // Then mount the router
      app.use('/api/channels', messagesRouter);

      // Create messages with fixed timestamps for consistent testing
      const baseDate = new Date('2025-01-10T12:00:00Z');
      const twoDaysAgo = new Date(baseDate);
      const yesterday = new Date(baseDate);

      twoDaysAgo.setDate(baseDate.getDate() - 2); // 2025-01-08
      yesterday.setDate(baseDate.getDate() - 1);   // 2025-01-09

      // Create messages in chronological order
      await db.insert(messagesTable).values([
        {
          content: 'Message from two days ago',
          channelId: testChannel.id,
          userId: testUser.id,
          deleted: false,
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo
        },
        {
          content: 'Message from yesterday',
          channelId: testChannel.id,
          userId: testUser.id,
          deleted: false,
          createdAt: yesterday,
          updatedAt: yesterday
        }
      ]);

      // Test range query - messages between two days ago and yesterday (inclusive)
      const rangeResponse = await request(app)
        .get(`/api/channels/${testChannel.id}/messages`)
        .query({
          after: twoDaysAgo.toISOString(),
          before: baseDate.toISOString()
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(rangeResponse.body).toHaveProperty('messages');
      expect(Array.isArray(rangeResponse.body.messages)).toBe(true);
      expect(rangeResponse.body.messages).toHaveLength(2);
      // Messages should be in reverse chronological order
      expect(rangeResponse.body.messages[0].content).toBe('Message from yesterday');
      expect(rangeResponse.body.messages[1].content).toBe('Message from two days ago');
    });

    it('should support cursor-based pagination', async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      // Then mount the router
      app.use('/api/channels', messagesRouter);

      // Create multiple test messages with different timestamps
      const baseDate = new Date('2025-01-10T12:00:00Z');
      const messages = await Promise.all(
        Array.from({ length: 25 }, (_, i) => {
          const date = new Date(baseDate);
          date.setMinutes(date.getMinutes() - i);
          return db.insert(messagesTable).values({
            content: `Test message ${i + 1}`,
            channelId: testChannel.id,
            userId: testUser.id,
            deleted: false,
            createdAt: date,
            updatedAt: date
          }).returning();
        })
      );

      // Flatten messages array since each insert returns an array
      const allMessages = messages.flat();

      // Get first page
      const firstPageResponse = await request(app)
        .get(`/api/channels/${testChannel.id}/messages`)
        .query({ limit: 10 })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(firstPageResponse.body).toHaveProperty('messages');
      expect(Array.isArray(firstPageResponse.body.messages)).toBe(true);
      expect(firstPageResponse.body.messages).toHaveLength(10);
      expect(firstPageResponse.body).toHaveProperty('nextCursor');
      expect(firstPageResponse.body.messages[0].content).toBe('Test message 1');

      // Get next page using cursor
      const secondPageResponse = await request(app)
        .get(`/api/channels/${testChannel.id}/messages`)
        .query({
          limit: 10,
          cursor: firstPageResponse.body.nextCursor
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(secondPageResponse.body).toHaveProperty('messages');
      expect(Array.isArray(secondPageResponse.body.messages)).toBe(true);
      expect(secondPageResponse.body.messages).toHaveLength(10);
      expect(secondPageResponse.body).toHaveProperty('nextCursor');
      expect(secondPageResponse.body.messages[0].content).toBe('Test message 11');
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
      const [message] = await db.insert(messagesTable).values({
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

      expect(response.body).toHaveProperty('messages');
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0]).toEqual(expect.objectContaining({
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
        return db.insert(messagesTable).values({
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
        .get(`/api/channels/${testChannel.id}/messages`)
        .query({ limit: 10 })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages).toHaveLength(10);
      // Most recent messages should appear first
      expect(response.body.messages[0].content).toBe('Test message 1');
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
        .from(messagesTable)
        .where(eq(messagesTable.id, response.body.id));

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

  describe('PUT /api/channels/:channelId/messages/:messageId', () => {
    let testMessage: any;

    beforeEach(async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      // Then mount the router
      app.use('/api/channels', messagesRouter);

      // Create a test message
      [testMessage] = await db.insert(messagesTable).values({
        content: 'Original message',
        channelId: testChannel.id,
        userId: testUser.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
    });

    it('should update message content', async () => {
      const updateData = {
        content: 'Updated message'
      };

      const response = await request(app)
        .put(`/api/channels/${testChannel.id}/messages/${testMessage.id}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        id: testMessage.id,
        content: updateData.content,
        channelId: testChannel.id,
        userId: testUser.id,
        deleted: false
      }));

      // Verify message was actually updated in database
      const [dbMessage] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.id, testMessage.id));

      expect(dbMessage.content).toBe(updateData.content);
    });

    it('should not allow updating messages from other users', async () => {
      // Create another user
      const [otherUser] = await db.insert(users).values({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'hashedpassword',
        displayName: 'Other User'
      }).returning();

      // Create message from other user
      const [otherMessage] = await db.insert(messagesTable).values({
        content: 'Message from other user',
        channelId: testChannel.id,
        userId: otherUser.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      const updateData = {
        content: 'Trying to update other user message'
      };

      const response = await request(app)
        .put(`/api/channels/${testChannel.id}/messages/${otherMessage.id}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Not authorized to modify this message');
    });
  });

  describe('DELETE /api/channels/:channelId/messages/:messageId', () => {
    let testMessage: any;

    beforeEach(async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      // Then mount the router
      app.use('/api/channels', messagesRouter);

      // Create a test message
      [testMessage] = await db.insert(messagesTable).values({
        content: 'Message to delete',
        channelId: testChannel.id,
        userId: testUser.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
    });

    it('should soft delete a message', async () => {
      const response = await request(app)
        .delete(`/api/channels/${testChannel.id}/messages/${testMessage.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Message deleted');

      // Verify message was soft deleted in database
      const [dbMessage] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.id, testMessage.id));

      expect(dbMessage.deleted).toBe(true);
    });

    it('should not allow deleting messages from other users', async () => {
      // Create another user
      const [otherUser] = await db.insert(users).values({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'hashedpassword',
        displayName: 'Other User'
      }).returning();

      // Create message from other user
      const [otherMessage] = await db.insert(messagesTable).values({
        content: 'Message from other user',
        channelId: testChannel.id,
        userId: otherUser.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      const response = await request(app)
        .delete(`/api/channels/${testChannel.id}/messages/${otherMessage.id}`)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Not authorized to modify this message');
    });
  });
});