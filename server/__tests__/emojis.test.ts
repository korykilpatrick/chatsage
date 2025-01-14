import request from 'supertest';
import express from 'express';
import { db } from '../../db';
import { emojis } from '../../db/schema';
import { eq } from 'drizzle-orm';
import emojisRouter from '../routes/emojis';

const app = express();
app.use(express.json());
app.use('/api/emojis', emojisRouter);

describe('Emoji Routes', () => {
  // Clean up database before each test
  beforeEach(async () => {
    await db.delete(emojis);
  });

  describe('GET /api/emojis', () => {
    it('should return empty array when no emojis exist', async () => {
      const response = await request(app).get('/api/emojis');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all non-deleted emojis', async () => {
      // Create test emojis
      await db.insert(emojis).values([
        { code: '👍', deleted: false },
        { code: '👎', deleted: true },
      ]);

      const response = await request(app).get('/api/emojis');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].code).toBe('👍');
    });
  });

  describe('POST /api/emojis', () => {
    it('should create a new emoji', async () => {
      const response = await request(app)
        .post('/api/emojis')
        .send({ code: '😊' });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('😊');
      expect(response.body.deleted).toBe(false);
    });

    it('should reject invalid emoji data', async () => {
      const response = await request(app)
        .post('/api/emojis')
        .send({ code: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/emojis/:emojiId', () => {
    it('should return specific emoji', async () => {
      const [emoji] = await db.insert(emojis)
        .values({ code: '🎉', deleted: false })
        .returning();

      const response = await request(app).get(`/api/emojis/${emoji.id}`);
      expect(response.status).toBe(200);
      expect(response.body.code).toBe('🎉');
    });

    it('should return 404 for non-existent emoji', async () => {
      const response = await request(app).get('/api/emojis/999');
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/emojis/:emojiId', () => {
    it('should soft delete an emoji', async () => {
      const [emoji] = await db.insert(emojis)
        .values({ code: '🌟', deleted: false })
        .returning();

      const response = await request(app).delete(`/api/emojis/${emoji.id}`);
      expect(response.status).toBe(204);

      // Verify emoji is soft deleted
      const deletedEmoji = await db.query.emojis.findFirst({
        where: eq(emojis.id, emoji.id)
      });
      expect(deletedEmoji?.deleted).toBe(true);
    });

    it('should return 404 for non-existent emoji', async () => {
      const response = await request(app).delete('/api/emojis/999');
      expect(response.status).toBe(404);
    });
  });
});