import { Router, Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { channels, workspaces, channelTypeEnum } from '@db/schema';
import { and, eq } from 'drizzle-orm';

const router = Router();

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// GET /api/workspaces/:workspaceId/channels
router.get('/:workspaceId/channels', requireAuth, async (req: Request, res: Response) => {
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
      return res.status(404).json({ error: 'Workspace not found' });
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
      .where(and(...conditions));

    return res.json({
      channels: channelsList
    });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/workspaces/:workspaceId/channels
router.post('/:workspaceId/channels', requireAuth, async (req: Request, res: Response) => {
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
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const { name, type = 'PUBLIC' } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Channel name cannot be empty' });
    }

    // Create new channel
    const [newChannel] = await db
      .insert(channels)
      .values({
        name: name.trim(),
        workspaceId,
        type: type as typeof channelTypeEnum.enumValues[number],
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
      return res.status(404).json({ error: 'Channel not found' });
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

    const { name, type } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Channel name cannot be empty' });
    }

    // Check if channel exists
    const [existingChannel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!existingChannel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Update channel
    const [updatedChannel] = await db
      .update(channels)
      .set({
        name: name.trim(),
        type: type as typeof channelTypeEnum.enumValues[number],
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
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Archive channel instead of deleting
    await db
      .update(channels)
      .set({
        archived: true,
        updatedAt: new Date()
      })
      .where(eq(channels.id, channelId));

    return res.json({ message: 'Channel archived' });
  } catch (error) {
    console.error('Error archiving channel:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;