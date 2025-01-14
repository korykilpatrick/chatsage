import { Router, Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { messageReactions, messages, emojis } from '@db/schema';
import { and, eq } from 'drizzle-orm';

const router = Router({ mergeParams: true });

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// POST /api/messages/:messageId/reactions
router.post('/:messageId/reactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const { emojiId } = req.body;
    if (!emojiId) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Emoji ID is required' });
    }

    // Check if message exists
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if emoji exists
    const [emoji] = await db
      .select()
      .from(emojis)
      .where(eq(emojis.id, emojiId))
      .limit(1);

    if (!emoji || emoji.deleted) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Emoji not found' });
    }

    // Check if reaction already exists
    const [existingReaction] = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.emojiId, emojiId),
          eq(messageReactions.userId, req.user.id)
        )
      )
      .limit(1);

    if (existingReaction) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Reaction already exists' });
    }

    // Create reaction
    const [newReaction] = await db
      .insert(messageReactions)
      .values({
        messageId,
        emojiId,
        userId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json(newReaction);
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/messages/:messageId/reactions/:emojiId
router.delete('/:messageId/reactions/:emojiId', requireAuth, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const emojiId = parseInt(req.params.emojiId);
    
    if (isNaN(messageId) || isNaN(emojiId)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid message ID or emoji ID' });
    }

    // Check if reaction exists
    const [existingReaction] = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.emojiId, emojiId),
          eq(messageReactions.userId, req.user.id)
        )
      )
      .limit(1);

    if (!existingReaction) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Reaction not found' });
    }

    // Delete reaction
    await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.emojiId, emojiId),
          eq(messageReactions.userId, req.user.id)
        )
      );

    res.setHeader('Content-Type', 'application/json');
    return res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/messages/:messageId/reactions
router.get('/:messageId/reactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    // Check if message exists
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Message not found' });
    }

    // Get reactions with emoji and user information
    const reactions = await db
      .select({
        reaction: messageReactions,
        emoji: emojis
      })
      .from(messageReactions)
      .innerJoin(emojis, eq(messageReactions.emojiId, emojis.id))
      .where(eq(messageReactions.messageId, messageId));

    res.setHeader('Content-Type', 'application/json');
    return res.json({
      reactions: reactions.map(({ reaction, emoji }) => ({
        ...reaction,
        emoji: {
          id: emoji.id,
          code: emoji.code
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
