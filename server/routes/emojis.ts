import { Router } from 'express';
import { db } from '../../db';
import { emojis } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Schema for emoji creation/validation
const emojiSchema = z.object({
  code: z.string().min(1, "Emoji code is required"),
});

// List all emojis (excluding deleted by default)
router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const query = includeDeleted 
      ? db.select().from(emojis)
      : db.select().from(emojis).where(eq(emojis.deleted, false));

    const emojiList = await query;
    res.json(emojiList);
  } catch (error) {
    console.error('Error fetching emojis:', error);
    res.status(500).json({ message: 'Failed to fetch emojis' });
  }
});

// Get specific emoji
router.get('/:emojiId', async (req, res) => {
  try {
    const emojiId = parseInt(req.params.emojiId);
    const emoji = await db.query.emojis.findFirst({
      where: eq(emojis.id, emojiId)
    });

    if (!emoji) {
      return res.status(404).json({ message: 'Emoji not found' });
    }

    res.json(emoji);
  } catch (error) {
    console.error('Error fetching emoji:', error);
    res.status(500).json({ message: 'Failed to fetch emoji' });
  }
});

// Create new emoji
router.post('/', async (req, res) => {
  try {
    const validation = emojiSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid emoji data',
        errors: validation.error.issues 
      });
    }

    const [newEmoji] = await db.insert(emojis)
      .values({
        code: validation.data.code,
        deleted: false,
      })
      .returning();

    res.status(201).json(newEmoji);
  } catch (error) {
    console.error('Error creating emoji:', error);
    res.status(500).json({ message: 'Failed to create emoji' });
  }
});

// Soft delete emoji
router.delete('/:emojiId', async (req, res) => {
  try {
    const emojiId = parseInt(req.params.emojiId);
    const emoji = await db.query.emojis.findFirst({
      where: eq(emojis.id, emojiId)
    });

    if (!emoji) {
      return res.status(404).json({ message: 'Emoji not found' });
    }

    await db.update(emojis)
      .set({ deleted: true })
      .where(eq(emojis.id, emojiId));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting emoji:', error);
    res.status(500).json({ message: 'Failed to delete emoji' });
  }
});

export default router;