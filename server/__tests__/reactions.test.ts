import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { messages as messagesTable, channels, users, emojis as emojisTable, messageReactions } from '@db/schema';
import { eq } from 'drizzle-orm';
import reactionsRouter from '../routes/reactions';

describe('Reactions API', () => {
  let app: express.Express;
  let testUser: any;
  let testChannel: any;
  let testMessage: any;
  let testEmoji: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Set Content-Type header for all responses
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

    // Clean up test data
    await db.delete(messageReactions);
    await db.delete(emojisTable);
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

    // Create test emoji
    [testEmoji] = await db.insert(emojisTable).values({
      code: 'test_emoji',
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Add auth middleware first
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = testUser;
      next();
    });

    // Mount the reactions router with mergeParams: true
    app.use('/api/messages', reactionsRouter);
  });

  afterEach(async () => {
    // Final cleanup
    await db.delete(messageReactions);
    await db.delete(emojisTable);
    await db.delete(messagesTable);
    await db.delete(channels);
    await db.delete(users);
  });

  describe('POST /api/messages/:messageId/reactions', () => {
    it('should add a reaction to a message', async () => {
      const response = await request(app)
        .post(`/api/messages/${testMessage.id}/reactions`)
        .send({ emojiId: testEmoji.id })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({
        messageId: testMessage.id,
        emojiId: testEmoji.id,
        userId: testUser.id
      }));

      // Verify reaction was created in database
      const [dbReaction] = await db
        .select()
        .from(messageReactions)
        .where(eq(messageReactions.messageId, testMessage.id));

      expect(dbReaction).toBeTruthy();
      expect(dbReaction.emojiId).toBe(testEmoji.id);
    });

    it('should prevent duplicate reactions', async () => {
      // Add initial reaction
      await db.insert(messageReactions).values({
        messageId: testMessage.id,
        emojiId: testEmoji.id,
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .post(`/api/messages/${testMessage.id}/reactions`)
        .send({ emojiId: testEmoji.id })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Reaction already exists');
    });

    it('should handle invalid message ID', async () => {
      const response = await request(app)
        .post('/api/messages/999/reactions')
        .send({ emojiId: testEmoji.id })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Message not found');
    });

    it('should handle invalid emoji ID', async () => {
      const response = await request(app)
        .post(`/api/messages/${testMessage.id}/reactions`)
        .send({ emojiId: 999 })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Emoji not found');
    });
  });

  describe('DELETE /api/messages/:messageId/reactions/:emojiId', () => {
    it('should remove a reaction', async () => {
      // Add reaction first
      await db.insert(messageReactions).values({
        messageId: testMessage.id,
        emojiId: testEmoji.id,
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .delete(`/api/messages/${testMessage.id}/reactions/${testEmoji.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Reaction removed successfully');

      // Verify reaction was removed from database
      const [dbReaction] = await db
        .select()
        .from(messageReactions)
        .where(eq(messageReactions.messageId, testMessage.id));

      expect(dbReaction).toBeUndefined();
    });

    it('should handle non-existent reaction', async () => {
      const response = await request(app)
        .delete(`/api/messages/${testMessage.id}/reactions/${testEmoji.id}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Reaction not found');
    });
  });

  describe('GET /api/messages/:messageId/reactions', () => {
    it('should return list of reactions for a message', async () => {
      // Add reaction first
      await db.insert(messageReactions).values({
        messageId: testMessage.id,
        emojiId: testEmoji.id,
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .get(`/api/messages/${testMessage.id}/reactions`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('reactions');
      expect(Array.isArray(response.body.reactions)).toBe(true);
      expect(response.body.reactions).toHaveLength(1);
      expect(response.body.reactions[0]).toMatchObject({
        messageId: testMessage.id,
        emojiId: testEmoji.id,
        userId: testUser.id,
        emoji: {
          id: testEmoji.id,
          code: testEmoji.code
        }
      });
    });

    it('should return empty array when no reactions exist', async () => {
      const response = await request(app)
        .get(`/api/messages/${testMessage.id}/reactions`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('reactions');
      expect(Array.isArray(response.body.reactions)).toBe(true);
      expect(response.body.reactions).toHaveLength(0);
    });

    it('should handle invalid message ID', async () => {
      const response = await request(app)
        .get('/api/messages/999/reactions')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Message not found');
    });
  });
});
