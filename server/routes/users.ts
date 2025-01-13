import { Router } from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/users - List all users with optional deactivated filter
router.get('/', async (req, res) => {
  try {
    const { deactivated } = req.query;
    let query = db.select().from(users);

    if (deactivated === 'true') {
      query = query.where(eq(users.deactivated, true));
    }

    const usersList = await query;

    // Remove password from response
    const sanitizedUsers = usersList.map(({ password, ...user }) => user);

    res.setHeader('Content-Type', 'application/json');
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/me - Get current user
router.get('/me', (req, res) => {
  if (!req.user) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { password, ...user } = req.user;
  res.setHeader('Content-Type', 'application/json');
  res.json(user);
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    const { password, ...userData } = user;
    res.setHeader('Content-Type', 'application/json');
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;