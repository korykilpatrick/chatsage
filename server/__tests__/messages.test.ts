import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { messages as messagesTable, channels, users } from '@db/schema';
import { eq } from 'drizzle-orm';
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

    // Add auth middleware first
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = testUser;
      next();
    });

    // Mount message routes
    app.use('/api/channels/:channelId/messages', messagesRouter);
    app.use('/api/messages', messagesRouter); // Add this for thread endpoints
  });

  afterEach(async () => {
    // Final cleanup
    await db.delete(messagesTable);
    await db.delete(channels);
    await db.delete(users);
  });

  describe('GET /api/channels/:channelId/messages', () => {
    it('should return empty array when no messages exist', async () => {
      const response = await request(app)
        .get(`/api/channels/${testChannel.id}/messages`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('messages');
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages).toHaveLength(0);
    });

    it('should return list of messages when messages exist', async () => {
      // Create test message
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

    it('should handle invalid channel ID', async () => {
      const response = await request(app)
        .get('/api/channels/999/messages')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Channel not found');
    });
  });

  describe('GET /api/messages/:messageId/thread', () => {
    let parentMessage: any;

    beforeEach(async () => {
      // Create parent message for thread tests
      [parentMessage] = await db.insert(messagesTable).values({
        content: 'Parent message',
        channelId: testChannel.id,
        userId: testUser.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Add thread replies
      await db.insert(messagesTable).values([
        {
          content: 'Reply 1',
          channelId: testChannel.id,
          userId: testUser.id,
          parentMessageId: parentMessage.id,
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          content: 'Reply 2',
          channelId: testChannel.id,
          userId: testUser.id,
          parentMessageId: parentMessage.id,
          deleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    });

    it('should return thread messages', async () => {
      const response = await request(app)
        .get(`/api/messages/${parentMessage.id}/thread`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('messages');
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages).toHaveLength(2);

      // Only check specific fields we care about for thread messages
      response.body.messages.forEach((message: any) => {
        expect(message).toMatchObject({
          content: expect.any(String),
          channelId: testChannel.id,
          userId: testUser.id,
          parentMessageId: parentMessage.id,
          deleted: false,
        });
      });
    });

    it('should return empty array when no thread messages exist', async () => {
      // Create a message without replies
      const [messageWithoutReplies] = await db.insert(messagesTable).values({
        content: 'Message without replies',
        channelId: testChannel.id,
        userId: testUser.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      const response = await request(app)
        .get(`/api/messages/${messageWithoutReplies.id}/thread`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('messages');
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages).toHaveLength(0);
    });

    it('should handle non-existent parent message', async () => {
      const response = await request(app)
        .get('/api/messages/999/thread')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Parent message not found');
    });
  });

  describe('POST /api/messages/:messageId/thread', () => {
    let parentMessage: any;

    beforeEach(async () => {
      // Create parent message for thread tests
      [parentMessage] = await db.insert(messagesTable).values({
        content: 'Parent message',
        channelId: testChannel.id,
        userId: testUser.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
    });

    it('should create a thread reply', async () => {
      const replyData = {
        content: 'New thread reply'
      };

      const response = await request(app)
        .post(`/api/messages/${parentMessage.id}/thread`)
        .send(replyData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Check only the fields we care about for thread creation
      expect(response.body).toMatchObject({
        content: replyData.content,
        channelId: testChannel.id,
        userId: testUser.id,
        parentMessageId: parentMessage.id,
        deleted: false,
        id: expect.any(Number),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      // Verify reply was created in database
      const [dbReply] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.parentMessageId, parentMessage.id));

      expect(dbReply).toBeTruthy();
      expect(dbReply.content).toBe(replyData.content);
    });

    it('should return 400 for empty reply content', async () => {
      const response = await request(app)
        .post(`/api/messages/${parentMessage.id}/thread`)
        .send({ content: '' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Message content cannot be empty');
    });

    it('should return 404 for non-existent parent message', async () => {
      const response = await request(app)
        .post('/api/messages/999/thread')
        .send({ content: 'Reply to non-existent message' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Parent message not found');
    });
  });
  describe('POST /api/channels/:channelId/messages', () => {
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

    it('should update message details', async () => {
      const updateData = {
        content: 'Updated message content'
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
        userId: testUser.id
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

      const response = await request(app)
        .put(`/api/channels/${testChannel.id}/messages/${otherMessage.id}`)
        .send({ content: 'Trying to update other user message' })
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Not authorized to modify this message');
    });
  });

  describe('DELETE /api/channels/:channelId/messages/:messageId', () => {
    let testMessage: any;

    beforeEach(async () => {
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