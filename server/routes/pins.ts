import { Router, Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { pinnedMessages, messages } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router({ mergeParams: true });

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// POST /api/messages/:messageId/pin
router.post('/:messageId/pin', requireAuth, async (req: Request, res: Response) => {
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

    // Check if message is already pinned
    const [existingPin] = await db
      .select()
      .from(pinnedMessages)
      .where(eq(pinnedMessages.messageId, messageId))
      .limit(1);

    if (existingPin) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Message is already pinned' });
    }

    // Create pin
    const [newPin] = await db
      .insert(pinnedMessages)
      .values({
        messageId,
        pinnedBy: req.user.id,
        pinnedReason: req.body.reason,
        pinnedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json(newPin);
  } catch (error) {
    console.error('Error pinning message:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/messages/:messageId/pin
router.delete('/:messageId/pin', requireAuth, async (req: Request, res: Response) => {
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

    // Check if pin exists
    const [existingPin] = await db
      .select()
      .from(pinnedMessages)
      .where(eq(pinnedMessages.messageId, messageId))
      .limit(1);

    if (!existingPin) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Message is not pinned' });
    }

    // Delete pin
    await db
      .delete(pinnedMessages)
      .where(eq(pinnedMessages.messageId, messageId));

    res.setHeader('Content-Type', 'application/json');
    return res.json({ message: 'Message unpinned successfully' });
  } catch (error) {
    console.error('Error unpinning message:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/channels/:channelId/pins
router.get('/:channelId/pins', requireAuth, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    // Get all pinned messages for the channel
    const pinnedMessagesList = await db
      .select({
        pin: pinnedMessages,
        message: messages
      })
      .from(pinnedMessages)
      .innerJoin(messages, eq(pinnedMessages.messageId, messages.id))
      .where(eq(messages.channelId, channelId));

    res.setHeader('Content-Type', 'application/json');
    return res.json({
      pins: pinnedMessagesList
    });
  } catch (error) {
    console.error('Error fetching pinned messages:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
