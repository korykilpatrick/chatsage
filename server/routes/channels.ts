import { Router, Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { channels, workspaces, channelTypeEnum, type Channel, type InsertChannel, users, userChannels } from '@db/schema';
import { and, eq, asc } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ 
      error: 'Not authenticated',
      details: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }
  next();
};

// Schema for channel creation/update
const channelSchema = z.object({
  name: z.string().min(1, 'Channel name cannot be empty')
    .max(100, 'Channel name too long')
    .regex(/^[a-z0-9-]+$/, 'Channel name can only contain lowercase letters, numbers, and hyphens'),
  type: z.enum(channelTypeEnum.enumValues).default('PUBLIC'),
  topic: z.string().optional().nullable(),
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
router.get('/', async (req: Request, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    if (isNaN(workspaceId)) {
      return res.status(400).json({ 
        error: 'Invalid workspace ID',
        details: {
          code: 'INVALID_WORKSPACE_ID',
          message: 'Workspace ID must be a valid number'
        }
      });
    }

    // Check if workspace exists
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return res.status(404).json({ 
        error: 'Workspace not found',
        details: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'The specified workspace does not exist'
        }
      });
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
    return res.status(500).json({ 
      error: 'Internal server error',
      details: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch channels'
      }
    });
  }
});

// POST /api/workspaces/:workspaceId/channels - Create channel
router.post('/', async (req: Request, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    if (isNaN(workspaceId)) {
      return res.status(400).json({ 
        error: 'Invalid workspace ID',
        details: {
          code: 'INVALID_WORKSPACE_ID',
          message: 'Workspace ID must be a valid number'
        }
      });
    }

    // Check if workspace exists
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return res.status(404).json({ 
        error: 'Workspace not found',
        details: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'The specified workspace does not exist'
        }
      });
    }

    const result = channelSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: {
          code: 'VALIDATION_ERROR',
          message: result.error.errors[0].message
        }
      });
    }

    const { name, type, topic } = result.data;

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
      return res.status(400).json({ 
        error: 'Channel exists',
        details: {
          code: 'CHANNEL_EXISTS',
          message: 'Channel name already exists in this workspace'
        }
      });
    }

    // Create new channel
    const [newChannel] = await db
      .insert(channels)
      .values({
        name: name.trim(),
        workspaceId,
        type,
        topic,
        archived: false,
        createdBy: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date()
      } as InsertChannel)
      .returning();

    return res.status(201).json(newChannel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: {
        code: 'SERVER_ERROR',
        message: 'Failed to create channel'
      }
    });
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

// POST /api/channels/:channelId/members - Add member to channel
router.post('/channels/:channelId/members', async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    const userId = parseInt(req.body.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
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

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const [existingMembership] = await db
      .select()
      .from(userChannels)
      .where(
        and(
          eq(userChannels.userId, userId),
          eq(userChannels.channelId, channelId)
        )
      )
      .limit(1);

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member of this channel' });
    }

    // Add user to channel
    await db.insert(userChannels).values({
      userId,
      channelId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({ message: 'Member added to channel' });
  } catch (error) {
    console.error('Error adding channel member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/channels/:channelId/members - Remove member from channel
router.delete('/channels/:channelId/members', async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    const userId = parseInt(req.query.userId as string);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
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

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is a member
    const [membership] = await db
      .select()
      .from(userChannels)
      .where(
        and(
          eq(userChannels.userId, userId),
          eq(userChannels.channelId, channelId)
        )
      )
      .limit(1);

    if (!membership) {
      return res.status(400).json({ error: 'User is not a member of this channel' });
    }

    // Remove user from channel
    await db
      .delete(userChannels)
      .where(
        and(
          eq(userChannels.userId, userId),
          eq(userChannels.channelId, channelId)
        )
      );

    return res.json({ message: 'Member removed from channel' });
  } catch (error) {
    console.error('Error removing channel member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;