import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { messages as messagesTable, channels, users, pinnedMessages } from '@db/schema';
import { eq } from 'drizzle-orm';
import pinsRouter from '../routes/pins';

describe('Pins API', () => {
  let app: express.Express;
  let testUser: any;
  let testChannel: any;
  let testMessage: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Set Content-Type header for all responses
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

    // Clean up test data
    await db.delete(pinnedMessages);
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

    // Create test message
    [testMessage] = await db.insert(messagesTable).values({
      content: 'Test message',
      channelId: testChannel.id,
      userId: testUser.id,
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Add auth middleware first
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = testUser;
      next();
    });

    // Mount the pins router with mergeParams: true
    app.use('/api/messages', pinsRouter);
    app.use('/api/channels', pinsRouter);
  });

  afterEach(async () => {
    // Final cleanup
    await db.delete(pinnedMessages);
    await db.delete(messagesTable);
    await db.delete(channels);
    await db.delete(users);
  });

  describe('POST /api/messages/:messageId/pin', () => {
    it('should pin a message', async () => {
      const pinData = {
        reason: 'Important announcement'
      };

      const response = await request(app)
        .post(`/api/messages/${testMessage.id}/pin`)
        .send(pinData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({
        messageId: testMessage.id,
        pinnedBy: testUser.id,
        pinnedReason: pinData.reason
      }));

      // Verify pin was created in database
      const [dbPin] = await db
        .select()
        .from(pinnedMessages)
        .where(eq(pinnedMessages.messageId, testMessage.id));

      expect(dbPin).toBeTruthy();
      expect(dbPin.pinnedReason).toBe(pinData.reason);
    });

    it('should return 404 for non-existent message', async () => {
      const response = await request(app)
        .post('/api/messages/999/pin')
        .send({ reason: 'Test reason' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Message not found');
    });

    it('should prevent pinning already pinned message', async () => {
      // Pin the message first
      await db.insert(pinnedMessages).values({
        messageId: testMessage.id,
        pinnedBy: testUser.id,
        pinnedReason: 'First pin',
        pinnedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .post(`/api/messages/${testMessage.id}/pin`)
        .send({ reason: 'Second pin attempt' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Message is already pinned');
    });
  });

  describe('DELETE /api/messages/:messageId/pin', () => {
    it('should unpin a message', async () => {
      // Pin the message first
      await db.insert(pinnedMessages).values({
        messageId: testMessage.id,
        pinnedBy: testUser.id,
        pinnedReason: 'Test pin',
        pinnedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .delete(`/api/messages/${testMessage.id}/pin`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Message unpinned successfully');

      // Verify pin was removed from database
      const [dbPin] = await db
        .select()
        .from(pinnedMessages)
        .where(eq(pinnedMessages.messageId, testMessage.id));

      expect(dbPin).toBeUndefined();
    });

    it('should return 404 for non-pinned message', async () => {
      const response = await request(app)
        .delete(`/api/messages/${testMessage.id}/pin`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Message is not pinned');
    });
  });

  describe('GET /api/channels/:channelId/pins', () => {
    it('should return list of pinned messages', async () => {
      // Pin the message first
      await db.insert(pinnedMessages).values({
        messageId: testMessage.id,
        pinnedBy: testUser.id,
        pinnedReason: 'Test pin',
        pinnedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .get(`/api/channels/${testChannel.id}/pins`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('pins');
      expect(Array.isArray(response.body.pins)).toBe(true);
      expect(response.body.pins).toHaveLength(1);
      expect(response.body.pins[0]).toMatchObject({
        pin: expect.objectContaining({
          messageId: testMessage.id,
          pinnedBy: testUser.id,
          pinnedReason: 'Test pin'
        }),
        message: expect.objectContaining({
          id: testMessage.id,
          content: 'Test message',
          channelId: testChannel.id
        })
      });
    });

    it('should return empty list when no pins exist', async () => {
      const response = await request(app)
        .get(`/api/channels/${testChannel.id}/pins`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('pins');
      expect(Array.isArray(response.body.pins)).toBe(true);
      expect(response.body.pins).toHaveLength(0);
    });

    it('should handle invalid channel ID', async () => {
      const response = await request(app)
        .get('/api/channels/invalid/pins')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid channel ID');
    });
  });
});
