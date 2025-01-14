import { Router, Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { messages, channels } from '@db/schema';
import { and, eq, desc, gt, lt, lte, gte, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = Router({ mergeParams: true }); // Add mergeParams to access parent route parameters

// Message validation schema
const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(2000, 'Message content too long'),
});

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Authorization middleware for message modifications
const canModifyMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.userId !== req.user!.id) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({ error: 'Not authorized to modify this message' });
    }

    // Add message to request for later use
    (req as any).message = message;
    next();
  } catch (error) {
    console.error('Error in authorization middleware:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/channels/:channelId/messages
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    // Check if channel exists
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Parse query parameters
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string), 50) : 50;
    const cursor = req.query.cursor as string | undefined;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;
    const after = req.query.after ? new Date(req.query.after as string) : undefined;
    const includeDeleted = req.query.includeDeleted === 'true';

    // Build conditions array
    const conditions = [
      eq(messages.channelId, channelId),
      eq(messages.parentMessageId, null) // Only get top-level messages, not thread replies
    ];

    if (!includeDeleted) {
      conditions.push(eq(messages.deleted, false));
    }

    // Handle timestamp filtering
    if (before && after) {
      conditions.push(
        and(
          lte(messages.createdAt, before),
          gte(messages.createdAt, after)
        )
      );
    } else if (before) {
      conditions.push(lte(messages.createdAt, before));
    } else if (after) {
      conditions.push(gte(messages.createdAt, after));
    }

    // Handle cursor-based pagination
    if (cursor) {
      try {
        const [timestamp, id] = Buffer.from(cursor, 'base64')
          .toString()
          .split(':');
        const cursorDate = new Date(parseInt(timestamp));
        const cursorId = parseInt(id);

        conditions.push(
          sql`(${messages.createdAt}, ${messages.id}) < (${cursorDate}, ${cursorId})`
        );
      } catch (e) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Invalid cursor format' });
      }
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

    res.setHeader('Content-Type', 'application/json');
    return res.json({
      messages: results,
      nextCursor
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/channels/:channelId/messages
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    const result = messageSchema.safeParse(req.body);
    if (!result.success) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    // Check if channel exists
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Create new message
    const [newMessage] = await db
      .insert(messages)
      .values({
        content: result.data.content.trim(),
        channelId,
        userId: req.user!.id,
        workspaceId: channel.workspaceId,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/messages/:messageId
router.put('/:messageId', requireAuth, canModifyMessage, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const result = messageSchema.safeParse(req.body);
    if (!result.success) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    // Update message
    const [updatedMessage] = await db
      .update(messages)
      .set({
        content: result.data.content.trim(),
        updatedAt: new Date()
      })
      .where(eq(messages.id, messageId))
      .returning();

    res.setHeader('Content-Type', 'application/json');
    return res.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/messages/:messageId
router.delete('/:messageId', requireAuth, canModifyMessage, async (req: Request, res: Response) => {
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

    res.setHeader('Content-Type', 'application/json');
    return res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/messages/:messageId/thread
router.get('/:messageId/thread', requireAuth, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    // Check if parent message exists
    const [parentMessage] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!parentMessage) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Parent message not found' });
    }

    // Get thread messages
    const threadMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.parentMessageId, messageId))
      .orderBy(messages.createdAt);

    res.setHeader('Content-Type', 'application/json');
    return res.json({
      messages: [...threadMessages]
    });
  } catch (error) {
    console.error('Error fetching thread messages:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/messages/:messageId/thread
router.post('/:messageId/thread', requireAuth, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const result = messageSchema.safeParse(req.body);
    if (!result.success) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    // Check if parent message exists
    const [parentMessage] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!parentMessage) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Parent message not found' });
    }

    // Create thread message
    const [newMessage] = await db
      .insert(messages)
      .values({
        content: result.data.content.trim(),
        channelId: parentMessage.channelId,
        userId: req.user!.id,
        workspaceId: parentMessage.workspaceId,
        parentMessageId: messageId,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating thread message:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;