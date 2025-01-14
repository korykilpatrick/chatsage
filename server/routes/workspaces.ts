import { Router, Request, Response } from 'express';
import { db } from '@db';
import { workspaces } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Not authenticated'
    });
  }
  next();
};

// Create workspace
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Workspace name is required'
      });
    }

    // Create workspace
    const [workspace] = await db.insert(workspaces)
      .values({
        name,
        description: description || '',
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.status(201).json(workspace);
  } catch (error) {
    console.error('Workspace creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create workspace'
    });
  }
});

export default router;