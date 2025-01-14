import { Router } from 'express';
import { db } from '@db/index';
import { workspaces, userWorkspaces } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional()
});

const updateWorkspaceSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional()
});

const addMemberSchema = z.object({
  userId: z.number(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']).default('MEMBER')
});

// List all workspaces
router.get('/', async (req, res) => {
  try {
    const allWorkspaces = await db.query.workspaces.findMany({
      where: eq(workspaces.archived, false)
    });
    res.json(allWorkspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// Create a new workspace
router.post('/', async (req, res) => {
  try {
    const data = createWorkspaceSchema.parse(req.body);
    
    const [workspace] = await db.insert(workspaces)
      .values({
        name: data.name,
        description: data.description,
        archived: false
      })
      .returning();

    // Add creator as workspace owner
    await db.insert(userWorkspaces)
      .values({
        userId: req.user!.id,
        workspaceId: workspace.id,
        role: 'OWNER'
      });

    res.status(201).json(workspace);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// Get workspace details
router.get('/:workspaceId', async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId)
    });

    if (!workspace) {
      return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
    }

    res.json(workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
});

// Update workspace
router.put('/:workspaceId', async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    const data = updateWorkspaceSchema.parse(req.body);

    const [workspace] = await db.update(workspaces)
      .set(data)
      .where(eq(workspaces.id, workspaceId))
      .returning();

    if (!workspace) {
      return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
    }

    res.json(workspace);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating workspace:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// Archive (soft-delete) workspace
router.delete('/:workspaceId', async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    
    const [workspace] = await db.update(workspaces)
      .set({ archived: true })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    if (!workspace) {
      return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error archiving workspace:', error);
    res.status(500).json({ error: 'Failed to archive workspace' });
  }
});

// Add member to workspace
router.post('/:workspaceId/members', async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    const data = addMemberSchema.parse(req.body);

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId)
    });

    if (!workspace) {
      return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
    }

    await db.insert(userWorkspaces)
      .values({
        userId: data.userId,
        workspaceId,
        role: data.role
      });

    res.status(201).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error adding workspace member:', error);
    res.status(500).json({ error: 'Failed to add workspace member' });
  }
});

// Remove member from workspace
router.delete('/:workspaceId/members', async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    const userId = parseInt(req.query.userId as string);

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    await db.delete(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.workspaceId, workspaceId),
          eq(userWorkspaces.userId, userId)
        )
      );

    res.status(204).send();
  } catch (error) {
    console.error('Error removing workspace member:', error);
    res.status(500).json({ error: 'Failed to remove workspace member' });
  }
});

export default router;
