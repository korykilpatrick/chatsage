import { Router } from 'express';
import { db } from '@db';
import { messages, channels } from '@db/schema';
import { and, eq, desc } from 'drizzle-orm';

const router = Router();

// GET /api/channels/:channelId/messages - Get messages for a channel
router.get('/:channelId/messages', async (req, res) => {
  if (!req.user) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Not authenticated' });
  }

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

    // Parse pagination parameters
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;
    const includeDeleted = req.query.includeDeleted === 'true';

    // Build query
    let query = db
      .select()
      .from(messages)
      .where(eq(messages.channelId, channelId));

    if (!includeDeleted) {
      query = query.where(eq(messages.deleted, false));
    }

    if (before) {
      query = query.where(and(
        eq(messages.channelId, channelId),
        eq(messages.createdAt < before)
      ));
    }

    query = query
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    const messagesList = await query;

    res.setHeader('Content-Type', 'application/json');
    res.json(messagesList);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/channels/:channelId/messages - Create a new message
router.post('/:channelId/messages', async (req, res) => {
  if (!req.user) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Not authenticated' });
  }

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

    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    // Create new message
    const [newMessage] = await db
      .insert(messages)
      .values({
        content,
        channelId,
        userId: req.user.id,
        deleted: false
      })
      .returning();

    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
