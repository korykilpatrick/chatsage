import { Router, Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { channels, workspaces, channelTypeEnum, type Channel, type InsertChannel } from '@db/schema';
import { and, eq, asc } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Schema for channel creation/update
const channelSchema = z.object({
  name: z.string().min(1, 'Channel name cannot be empty')
    .max(100, 'Channel name too long')
    .regex(/^[a-z0-9-]+$/, 'Channel name can only contain lowercase letters, numbers, and hyphens'),
  type: z.enum(channelTypeEnum.enumValues).default('PUBLIC'),
});

// Helper to set JSON content type
const setJsonContentType = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json');
  next();
};

// Use middleware for all routes
router.use(setJsonContentType);
router.use(requireAuth);

// GET /api/workspaces/:workspaceId/channels - List channels in workspace
router.get('/workspaces/:workspaceId/channels', async (req: Request, res: Response) => {
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
      .where(and(...conditions))
      .orderBy(asc(channels.name));

    return res.json({ channels: channelsList });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/workspaces/:workspaceId/channels - Create channel
router.post('/workspaces/:workspaceId/channels', async (req: Request, res: Response) => {
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

    const result = channelSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { name, type } = result.data;

    // Check if channel name already exists in workspace
    const [existingChannel] = await db
      .select()
      .from(channels)
      .where(
        and(
          eq(channels.workspaceId, workspaceId),
          eq(channels.name, name.trim())
        )
      )
      .limit(1);

    if (existingChannel) {
      return res.status(400).json({ error: 'Channel name already exists in this workspace' });
    }

    // Create new channel
    const [newChannel] = await db
      .insert(channels)
      .values({
        name: name.trim(),
        workspaceId,
        type,
        archived: false,
        createdBy: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date()
      } as InsertChannel)
      .returning();

    return res.status(201).json(newChannel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/channels/:channelId - Get channel details
router.get('/channels/:channelId', async (req: Request, res: Response) => {
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

// PUT /api/channels/:channelId - Update channel
router.put('/channels/:channelId', async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    const result = channelSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { name, type } = result.data;

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

// DELETE /api/channels/:channelId - Archive channel
router.delete('/channels/:channelId', async (req: Request, res: Response) => {
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