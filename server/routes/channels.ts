import { Router, Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { channels, workspaces, users, channelTypeEnum, channelMembers } from '@db/schema';
import { and, eq, asc } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Schema for channel creation/update
const channelSchema = z.object({
  name: z.string().min(1, 'Channel name cannot be empty'),
  type: z.enum(channelTypeEnum.enumValues).default('PUBLIC'),
});

// GET /api/channels
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    let conditions = [];

    if (!includeArchived) {
      conditions.push(eq(channels.archived, false));
    }

    const channelsList = await db
      .select()
      .from(channels)
      .where(and(...conditions))
      .orderBy(asc(channels.name));

    return res.json(channelsList);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/channels
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = channelSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }

    const { name, type } = result.data;

    // Create new channel
    const [newChannel] = await db
      .insert(channels)
      .values({
        name: name.trim(),
        type,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return res.status(201).json(newChannel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces/:workspaceId/channels
router.get('/workspaces/:workspaceId/channels', requireAuth, async (req: Request, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    if (isNaN(workspaceId)) {
      return res.status(400).json({ error: 'Invalid workspace ID' });
    }

    // Check if workspace exists
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
    }

    // Get channels with optional archived filter
    const includeArchived = req.query.includeArchived === 'true';
    let conditions = [eq(channels.workspaceId, workspaceId)];

    if (!includeArchived) {
      conditions.push(eq(channels.archived, false));
    }

    const channelsList = await db
      .select()
      .from(channels)
      .where(and(...conditions))
      .orderBy(asc(channels.name));

    return res.json(channelsList);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/channels/:channelId
router.get('/:channelId', requireAuth, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      return res.status(404).json({ error: 'CHANNEL_NOT_FOUND' });
    }

    return res.json(channel);
  } catch (error) {
    console.error('Error fetching channel:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/channels/:channelId
router.put('/:channelId', requireAuth, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    const result = channelSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }

    const { name, type } = result.data;

    // Check if channel exists
    const [existingChannel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!existingChannel) {
      return res.status(404).json({ error: 'CHANNEL_NOT_FOUND' });
    }

    // Update channel
    const [updatedChannel] = await db
      .update(channels)
      .set({
        name: name.trim(),
        type,
        updatedAt: new Date()
      })
      .where(eq(channels.id, channelId))
      .returning();

    return res.json(updatedChannel);
  } catch (error) {
    console.error('Error updating channel:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/channels/:channelId
router.delete('/:channelId', requireAuth, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    // Check if channel exists
    const [existingChannel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!existingChannel) {
      return res.status(404).json({ error: 'CHANNEL_NOT_FOUND' });
    }

    // Archive channel instead of deleting
    await db
      .update(channels)
      .set({
        archived: true,
        updatedAt: new Date()
      })
      .where(eq(channels.id, channelId));

    return res.status(204).end();
  } catch (error) {
    console.error('Error archiving channel:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/channels/:channelId/members
router.post('/:channelId/members', requireAuth, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    const { userId } = req.body;
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if channel exists
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      return res.status(404).json({ error: 'CHANNEL_NOT_FOUND' });
    }

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    // Add user to channel
    await db.insert(channelMembers).values({
      channelId,
      userId,
      createdAt: new Date()
    });

    return res.status(201).json({ message: 'User added to the channel' });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'User is already a member of this channel' });
    }
    console.error('Error adding channel member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/channels/:channelId/members
router.delete('/:channelId/members', requireAuth, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const userId = parseInt(req.query.userId as string);

    if (isNaN(channelId) || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid channel ID or user ID' });
    }

    // Check if channel exists
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      return res.status(404).json({ error: 'CHANNEL_NOT_FOUND' });
    }

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    // Remove user from channel
    await db
      .delete(channelMembers)
      .where(and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId)
      ));

    return res.status(204).end();
  } catch (error) {
    console.error('Error removing channel member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;