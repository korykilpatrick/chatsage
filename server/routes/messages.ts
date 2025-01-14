import { Router, Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { messages, channels } from '@db/schema';
import { and, eq, desc, lt, gt, sql } from 'drizzle-orm';

const router = Router();

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Authorization middleware for message modifications
const canModifyMessage = async (req: Request, res: Response, next: NextFunction) => {
  const messageId = parseInt(req.params.messageId);
  if (isNaN(messageId)) {
    return res.status(400).json({ error: 'Invalid message ID' });
  }

  const [message] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (message.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Not authorized to modify this message' });
  }

  next();
};

// GET /api/channels/:channelId/messages
router.get('/:channelId/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    // Check if channel exists
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Parse query parameters
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const cursor = req.query.cursor as string | undefined;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;
    const after = req.query.after ? new Date(req.query.after as string) : undefined;
    const includeDeleted = req.query.includeDeleted === 'true';

    // Build conditions array
    const conditions = [eq(messages.channelId, channelId)];

    if (!includeDeleted) {
      conditions.push(eq(messages.deleted, false));
    }

    if (before) {
      conditions.push(lt(messages.createdAt, before));
    }

    if (after) {
      conditions.push(gt(messages.createdAt, after));
    }

    if (cursor) {
      const [decodedTimestamp, decodedId] = Buffer.from(cursor, 'base64')
        .toString()
        .split(':')
        .map(part => parseInt(part));

      conditions.push(
        sql`(${messages.createdAt}, ${messages.id}) < (${new Date(decodedTimestamp)}, ${decodedId})`
      );
    }

    // Execute query with all conditions
    const messagesList = await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(limit + 1);

    // Check if there are more results
    const hasMore = messagesList.length > limit;
    const results = messagesList.slice(0, limit);

    // Generate next cursor if there are more results
    let nextCursor: string | undefined;
    if (hasMore && results.length > 0) {
      const lastMessage = results[results.length - 1];
      nextCursor = Buffer.from(`${lastMessage.createdAt.getTime()}:${lastMessage.id}`).toString('base64');
    }

    return res.json({
      messages: results,
      nextCursor
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/channels/:channelId/messages
router.post('/:channelId/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    // Check if channel exists
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    // Create new message
    const [newMessage] = await db
      .insert(messages)
      .values({
        content: content.trim(),
        channelId,
        userId: req.user!.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/channels/:channelId/messages/:messageId
router.put('/:channelId/messages/:messageId', requireAuth, canModifyMessage, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    // Update message
    const [updatedMessage] = await db
      .update(messages)
      .set({
        content: content.trim(),
        updatedAt: new Date()
      })
      .where(eq(messages.id, messageId))
      .returning();

    return res.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/channels/:channelId/messages/:messageId
router.delete('/:channelId/messages/:messageId', requireAuth, canModifyMessage, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);

    // Soft delete message
    await db
      .update(messages)
      .set({
        deleted: true,
        updatedAt: new Date()
      })
      .where(eq(messages.id, messageId));

    return res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;